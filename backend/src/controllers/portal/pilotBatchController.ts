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
  return { firstName: parts[0] || 'User', lastName: parts.slice(1).join(' ') || 'Customer' };
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

const toTitleCase = (slug: string) =>
  slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

export const handlePilotBatchSubmission = async (req: Request, res: Response) => {
  try {
    const {
      email = '',
      service = 'background-removal',
      outputFormat = 'JPG',
      instructions = '',
    } = req.body as Record<string, string>;

    const uploadedFiles = req.files as { mainFiles?: Express.Multer.File[]; supportFiles?: Express.Multer.File[] } | undefined;
    const guestId = (req.body as any).guestId;
    const directMain = parseDirectUploads((req.body as any).mainUploads, guestId, 15);
    const directSupport = parseDirectUploads((req.body as any).supportUploads, guestId, 10) || [];
    const mainFiles: Array<{ originalname: string; buffer?: Buffer }> = directMain
      ? directMain.map((d) => ({ originalname: d.filename }))
      : uploadedFiles?.mainFiles || [];
    const supportFiles: Array<{ originalname: string; buffer?: Buffer }> = directMain
      ? directSupport.map((d) => ({ originalname: d.filename }))
      : uploadedFiles?.supportFiles || [];

    const isAuthenticatedUser = !!(req as any).customer?.id && !(req as any).customer?.isGuest;

    if (!isAuthenticatedUser && (!email.trim() || !email.includes('@'))) {
      return res.status(400).json({ success: false, message: 'A valid email address is required.' });
    }
    if (!mainFiles.length) {
      return res.status(400).json({ success: false, message: 'At least one main image is required.' });
    }

    let customer: any;
    let isNewCustomer = false;

    if (isAuthenticatedUser) {
      customer = await prisma.customer.findUnique({ where: { id: (req as any).customer.id } });
      if (!customer) {
        return res.status(404).json({ success: false, message: 'Customer account not found.' });
      }
    } else {
      customer = await prisma.customer.findUnique({ where: { email } });
      isNewCustomer = !customer;

      if (!customer) {
        const derivedName = email.split('@')[0].replace(/[._-]/g, ' ');
        const maxResult = await prisma.customer.aggregate({ _max: { customerNumber: true } });
        customer = await prisma.customer.create({
          data: {
            name: derivedName,
            email,
            companyName: `${derivedName}'s Brand`,
            tenantId: generateTenantId(),
            status: 'active',
            isGuest: false,
            customerNumber: (maxResult._max.customerNumber ?? 0) + 1,
          },
        });

        const tempPassword = randomBytes(18).toString('base64url');
        const passwordHash = await bcrypt.hash(tempPassword, 10);
        const n = splitName(derivedName);
        await prisma.user.create({
          data: {
            firstName: n.firstName,
            lastName: n.lastName,
            email,
            passwordHash,
            role: 'customer',
            customerId: customer.id,
          },
        }).catch(() => {});
      }
    }

    const customerCode = `CLT${String(customer.customerNumber).padStart(3, '0')}`;

    const mainUploadResults: any[] = directMain
      ? directMain.map((d) => ({ success: true, url: d.url, path: d.path }))
      : await Promise.all(
      mainFiles.map(file => uploadToDropbox(file.buffer!, file.originalname, { customerCode }))
    );

    const failedUpload = mainUploadResults.find(r => !r.success);
    if (failedUpload) {
      return res.status(500).json({ success: false, message: failedUpload.error || 'File upload failed.' });
    }

    const supportUploadResults: any[] = directMain
      ? directSupport.map((d) => ({ success: true, url: d.url, path: d.path }))
      : await Promise.all(
      supportFiles.map(file => uploadToDropbox(file.buffer!, file.originalname, { customerCode }))
    ).catch(() => [] as any[]);

    const orderCode = await generateOrderCode();
    const order = await prisma.order.create({
      data: {
        code: orderCode,
        customerId: customer.id,
        tenantId: customer.tenantId,
        title: `Test Batch — ${toTitleCase(service)}`,
        description: instructions || 'Test batch submitted for review and pricing.',
        volume: mainFiles.length,
        photoCount: mainFiles.length,
        status: 'new_review',
        serviceType: service.replace(/-/g, '_'),
        outputFormat,
        images: {
          create: [
            ...mainUploadResults.map((uploaded, i) => ({
              url: uploaded.url!,
              path: uploaded.path || null,
              filename: mainFiles[i].originalname,
              status: 'pending',
              type: 'work',
            })),
            ...supportUploadResults
              .filter(r => r?.success)
              .map((uploaded, i) => ({
                url: uploaded.url!,
                path: uploaded.path || null,
                filename: supportFiles[i]?.originalname || `support-${i + 1}`,
                status: 'pending',
                type: 'support',
              })),
          ],
        },
      },
    });

    if (isNewCustomer) {
      prisma.lead.findFirst({ where: { email } }).then(existing => {
        if (!existing) {
          return prisma.lead.create({
            data: {
              name: customer.name,
              email,
              company: customer.companyName || '',
              source: 'pilot-batch',
              status: 'new',
              score: 5,
            },
          });
        }
        return null;
      }).catch(err => console.warn('[PilotBatch] Lead creation failed:', err));

      fireSignupNotifications({
        id: customer.id,
        name: customer.name,
        email: customer.email,
        customerCode,
        customerNumber: customer.customerNumber,
        source: 'pilot_batch',
        createdAt: customer.createdAt,
      });
    }

    (async () => {
      try {
        const folderLink = mainUploadResults[0]?.path
          ? await getDropboxFolderLink(mainUploadResults[0].path.split('/').slice(0, -1).join('/') || 'unassigned')
          : undefined;

        fireOrderNotifications({
          orderId: order.id,
          code: order.code,
          title: order.title,
          customerName: customer.companyName || customer.name,
          customerEmail: customer.email,
          services: order.serviceType,
          volume: order.volume,
          turnaround: '24-48',
          isRush: false,
          isGuest: false,
          createdAt: order.createdAt,
          dropboxLink: folderLink || mainUploadResults[0]?.url || undefined,
        });
      } catch (notifErr) {
        console.error('[PilotBatch] Notification failed:', notifErr);
      }
    })();

    const token = !isAuthenticatedUser
      ? jwt.sign({ id: customer.id, email: customer.email, type: 'portal' }, JWT_SECRET, { expiresIn: '7d' })
      : null;

    return res.status(200).json({
      success: true,
      orderCode: order.code,
      ...(token ? { token, user: { id: customer.id, name: customer.name, email: customer.email } } : {}),
    });
  } catch (error: any) {
    console.error('[PilotBatch] Submission error:', error);
    return res.status(500).json({ success: false, message: safeError(error) });
  }
};
