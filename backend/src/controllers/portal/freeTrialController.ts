import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomBytes, randomInt } from 'crypto';
import { prisma } from '../../database';
import { uploadToDropbox, getDropboxFolderLink } from '../../services/dropboxService';
import { safeError } from '../../utils/errors';
import { fireOrderNotifications, fireSignupNotifications } from '../../services/notificationService';
import { parseDirectUploads } from '../../services/directUploadService';

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';

const generateTenantId = () => `tenant-${randomBytes(6).toString('base64url')}`;

const splitName = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || 'User',
    lastName: parts.slice(1).join(' ') || 'Customer',
  };
};

const generateOrderCode = async (): Promise<string> => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  while (true) {
    let code = 'RF-';
    for (let i = 0; i < 6; i++) code += chars[randomInt(chars.length)];
    const existing = await prisma.order.findUnique({ where: { code } });
    if (!existing) return code;
  }
};

export const handleFreeTrialSubmission = async (req: Request, res: Response) => {
  try {
    const { name = '', email = '', description = '', sourceLink = '' } = req.body as Record<string, string>;
    const multipartFiles = (req.files as Express.Multer.File[]) || [];
    const direct = parseDirectUploads((req.body as any).uploadedFiles, (req.body as any).guestId, 3);
    const files: Array<{ originalname: string }> = direct
      ? direct.map((d) => ({ originalname: d.filename }))
      : multipartFiles;

    if (!name.trim() || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Name and email are required.' });
    }
    if (!files.length) {
      return res.status(400).json({ success: false, message: 'Source images are required.' });
    }

    let customer = await prisma.customer.findUnique({ where: { email } });
    let user = await prisma.user.findUnique({ where: { email } });
    const isNewCustomer = !customer;

    if (!customer) {
      const maxResult = await prisma.customer.aggregate({ _max: { customerNumber: true } });
      customer = await prisma.customer.create({
        data: {
          name,
          email,
          companyName: `${name}'s Brand`,
          tenantId: generateTenantId(),
          status: 'active',
          isGuest: false,
          customerNumber: (maxResult._max.customerNumber ?? 0) + 1,
        },
      });
    }

    if (!user) {
      const tempPassword = randomBytes(18).toString('base64url');
      const passwordHash = await bcrypt.hash(tempPassword, 10);
      const n = splitName(name);
      user = await prisma.user.create({
        data: {
          firstName: n.firstName,
          lastName: n.lastName,
          email,
          passwordHash,
          role: 'customer',
          customerId: customer.id,
        },
      });
    }

    const uploadResults: Array<{ success: boolean; url?: string; path?: string; error?: string }> = direct
      ? direct.map((d) => ({ success: true, url: d.url, path: d.path }))
      : await Promise.all(
      multipartFiles.map((file) => uploadToDropbox(file.buffer, file.originalname, {
        customerCode: customer?.customerNumber ? `CLT${String(customer.customerNumber).padStart(3, '0')}` : undefined,
      }))
    );

    const failed = uploadResults.find((r) => !r.success);
    if (failed || !customer) {
      return res.status(500).json({ success: false, message: failed?.error || 'Upload failed' });
    }

    const orderCode = await generateOrderCode();
    const order = await prisma.order.create({
      data: {
        code: orderCode,
        customerId: customer.id,
        tenantId: customer.tenantId,
        title: 'Free Trial Retouching',
        description: description || 'Free sample project retouching',
        volume: files.length,
        photoCount: files.length,
        // A brand-new submission has not been picked up by anyone yet. Creating it
        // as in_progress made the customer's tracker show SUBMITTED and AWAITING
        // APPROVAL already complete and the job "In Progress" at 0%.
        status: 'new_review',
        serviceType: 'free_trial',
        customFilesLink: sourceLink.trim().slice(0, 2048) || null,
        images: {
          create: uploadResults.map((uploaded, i) => ({
            url: uploaded.url!,
            path: uploaded.path || null,
            filename: files[i].originalname,
            status: 'pending',
            type: 'work',
          })),
        },
      },
    });

    // Create a lead entry for new customers
    if (isNewCustomer && customer) {
      prisma.lead.findFirst({ where: { email } }).then(existing => {
        if (!existing) {
          return prisma.lead.create({
            data: {
              name,
              email,
              company: customer!.companyName || `${name}'s Brand`,
              source: 'free-trial',
              status: 'new',
              score: 0,
            },
          });
        }
        return null;
      }).catch(err => console.warn('[FreeTrial] Failed to create lead:', err));
    }

    // Fire signup notifications if it's a new client
    if (isNewCustomer && customer) {
      fireSignupNotifications({
        id: customer.id,
        name: customer.name || name,
        email: customer.email,
        customerCode: `CLT${String(customer.customerNumber).padStart(3, '0')}`,
        customerNumber: customer.customerNumber,
        source: 'free_trial',
        createdAt: customer.createdAt,
      });
    }

    // Fire order notifications in background
    (async () => {
      try {
        const folderLink = uploadResults[0]?.path
          ? await getDropboxFolderLink(uploadResults[0].path.split('/').slice(0, -1).join('/') || 'unassigned')
          : undefined;

        fireOrderNotifications({
          orderId: order.id,
          code: order.code,
          title: order.title,
          customerName: customer?.companyName || customer?.name || name || 'Free Trial Customer',
          customerEmail: customer?.email || email || 'N/A',
          services: 'free_trial',
          volume: order.volume,
          turnaround: '24-72',
          isRush: false,
          isGuest: false,
          createdAt: order.createdAt,
          dropboxLink: folderLink || uploadResults[0]?.url || undefined,
        });
      } catch (notifErr) {
        console.error('[Notification] Failed to prepare free trial notification:', notifErr);
      }
    })();

    const token = jwt.sign({ id: customer.id, email: customer.email, type: 'portal' }, JWT_SECRET, { expiresIn: '7d' });

    return res.status(200).json({
      success: true,
      token,
      user: {
        id: customer.id,
        name: customer.name || name,
        email: customer.email,
        role: 'customer',
      },
      orderCode: order.code,
    });
  } catch (error: any) {
    console.error('Free trial provisioning error:', error);
    return res.status(500).json({ success: false, message: safeError(error) });
  }
};
