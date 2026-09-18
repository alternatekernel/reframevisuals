import { useState } from 'react';
import { getApiEndpoint } from '../../../lib/apiConfig';
import { OrderFlowData, OrderFlowStep } from '../types';
import { calculateOrderVolume } from '../../../utils/orderVolume';

interface UseOrderSubmitProps {
  orderData: OrderFlowData;
  guestId: string;
  draftKey?: string;
  setOrderFlowStep: React.Dispatch<React.SetStateAction<OrderFlowStep>>;
  onComplete: () => void;
  onError?: (message: string) => void;
}

export const useOrderSubmit = ({
  orderData,
  guestId,
  draftKey = 'reframe_order_draft',
  setOrderFlowStep,
  onComplete,
  onError,
}: UseOrderSubmitProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (): Promise<boolean> => {
    setIsSubmitting(true);
    setError(null);
    try {
      const token = localStorage.getItem('portal_token');
      const isLoggedIn = token && token !== 'null';
      const customerCode = localStorage.getItem('customer_code');

      // ── Step 0: Reserve Order Code ──────────────────────────────────────────
      let orderCode: string | null = null;
      try {
        const reserveRes = await fetch(getApiEndpoint('/portal/orders/reserve'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(isLoggedIn ? { Authorization: `Bearer ${token}` } : {}),
          },
          signal: AbortSignal.timeout(15000),
        });
        const reserveData = await reserveRes.json();
        if (reserveData.success) orderCode = reserveData.data.orderCode;
      } catch (err) {
        console.warn('[Order] Code reservation failed, using fallback');
      }

      const authHeaders: Record<string, string> = { 'X-Guest-ID': guestId };
      if (isLoggedIn) authHeaders['Authorization'] = `Bearer ${token}`;
      if (customerCode) authHeaders['X-Customer-Code'] = customerCode;
      if (orderCode) authHeaders['X-Order-Code'] = orderCode;
      if (orderData.idempotencyKey) authHeaders['X-Idempotency-Key'] = orderData.idempotencyKey;

      // ── Step 1 & 2: Parallel Uploads ────────────────────────────────────────
      const uploadOne = async (fileObj: File, uploadCategory: 'original' | 'support') => {
        const formData = new FormData();
        formData.append('file', fileObj);
        const res = await fetch(getApiEndpoint('/portal/upload'), {
          method: 'POST',
          headers: { ...authHeaders, 'X-Upload-Category': uploadCategory },
          body: formData,
          signal: AbortSignal.timeout(120000),
        });
        const result = await res.json();
        if (!result.success) {
          if (res.status === 401) {
            localStorage.removeItem('portal_token');
            throw new Error('Your session has expired. Please log in and try again.');
          }
          throw new Error(result.message || 'File upload failed');
        }
        return {
          url: result.data.url,
          path: result.data.path,
          folderPath: result.data.folderPath,
          filename: result.data.filename,
          type: uploadCategory === 'support' ? 'support' : 'work',
        };
      };

      const uploadTasks = [
        ...orderData.files.map((fileObj) => uploadOne(fileObj, 'original')),
        ...(orderData.supportFiles || []).map((fileObj) => uploadOne(fileObj, 'support')),
      ];

      if (orderData.background === 'custom' && orderData.customBgFile) {
        uploadTasks.push((async () => {
          const formData = new FormData();
          formData.append('file', orderData.customBgFile!);
          const res = await fetch(getApiEndpoint('/portal/upload'), {
            method: 'POST',
            headers: { ...authHeaders, 'X-Upload-Category': 'support' },
            body: formData,
            signal: AbortSignal.timeout(120000),
          });
          const result = await res.json();
          if (!result.success) {
            if (res.status === 401) {
              localStorage.removeItem('portal_token');
              throw new Error('Your session has expired. Please log in and try again.');
            }
            throw new Error(result.message || 'Background upload failed');
          }
          return {
            url: result.data.url,
            path: result.data.path,
            folderPath: result.data.folderPath,
            filename: result.data.filename,
            type: 'support',
          };
        })());
      }

      const uploadedImages = await Promise.all(uploadTasks);
      const linkedImages = (orderData.sourceLinks || []).map((url, index) => ({
        url,
        path: null,
        folderPath: null,
        filename: `External file link ${index + 1}`,
        type: 'source_link',
      }));
      const orderAssets = [...uploadedImages, ...linkedImages];

      // ── Step 3: Create Order ────────────────────────────────────────────────
      const response = await fetch(getApiEndpoint('/portal/orders'), {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(30000),
        body: JSON.stringify({
          title: orderData.projectName || 'New Project Order',
          description: orderData.instructions,
          services: orderData.selectedServices,
          volume: calculateOrderVolume(orderData),
          outputFormat: orderData.outputFormat,
          background: orderData.background,
          cropRatio: orderData.cropRatio,
          resizeWidth: orderData.resizeWidth,
          resizeHeight: orderData.resizeHeight,
          colorProfile: orderData.colorProfile,
          resolutionDPI: orderData.resolutionDPI,
          layering: orderData.layering,
          namingPattern: orderData.namingPattern,
          marginPercent: orderData.marginPercent,
          deliveryVector: orderData.deliveryVector,
          turnaround: orderData.turnaround,
          expectedCompletion: orderData.deadline || null,
          email: orderData.email,
          images: orderAssets,
          customFilesLink: orderData.customFilesLink || null,
          customFilesCount: orderData.customFilesLink ? (orderData.customFilesCount || 0) : null,
        }),
      });

      const finalResult = await response.json();
      if (finalResult.success) {
        localStorage.removeItem(draftKey);
        setOrderFlowStep('complete');
        return true;
      } else {
        if (response.status === 401) {
          localStorage.removeItem('portal_token');
          throw new Error('Your session has expired. Please log in and try again.');
        }
        throw new Error(finalResult.message || 'Failed to create order record');
      }
    } catch (err: any) {
      console.error('[Order] Submission error:', err);
      const msg = err.message || 'A network error occurred. Please try again.';
      setError(msg);
      onError?.(msg);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return { handleSubmit, isSubmitting, error };
};
