import { useCallback, useEffect, useState } from 'react';
import type { OrderFlowData, OrderFlowStep } from '../../order/types';
import { STORAGE } from '../constants';
import { createId, readJson } from '../lib';

const blankOrder = (email = ''): OrderFlowData => ({
  projectName: '',
  instructions: '',
  selectedServices: [],
  outputFormat: 'jpg',
  turnaround: '48',
  files: [],
  supportFiles: [],
  sourceLinks: [],
  background: 'white',
  cropRatio: 'original',
  resizeWidth: '',
  resizeHeight: '',
  colorProfile: 'sRGB',
  resolutionDPI: '72',
  layering: 'Flat',
  namingPattern: '',
  marginPercent: '0',
  deliveryVector: 'Dashboard',
  customFilesLink: '',
  customFilesCount: undefined,
  maintainAspectRatio: true,
  idempotencyKey: createId('idemp'),
  email,
});

const hasContent = (order: Partial<OrderFlowData>) => Boolean(
  order.projectName || order.instructions || order.selectedServices?.length || order.sourceLinks?.length,
);

/**
 * Order-in-progress for the widget. Text fields autosave (files can't be serialised),
 * so a half-finished order survives a reload and the sidebar offers "Resume Order".
 */
export const useOrderDraft = (userEmail?: string) => {
  const [order, setOrder] = useState<OrderFlowData>(() => {
    const saved = readJson<Partial<OrderFlowData> | null>(STORAGE.orderDraft, null);
    const base = blankOrder(userEmail);
    return saved ? { ...base, ...saved, files: [], supportFiles: [], idempotencyKey: saved.idempotencyKey || base.idempotencyKey } : base;
  });
  const [step, setStep] = useState<OrderFlowStep>('requirements');
  const [isActive, setIsActive] = useState(() => hasContent(readJson(STORAGE.orderDraft, {})));

  useEffect(() => {
    if (!isActive) return;
    const timer = window.setTimeout(() => {
      const { files, supportFiles, customBgFile, customBgImage, ...persistable } = order;
      localStorage.setItem(STORAGE.orderDraft, JSON.stringify(persistable));
    }, 400);
    return () => window.clearTimeout(timer);
  }, [isActive, order]);

  const startFresh = useCallback(() => {
    setOrder(blankOrder(userEmail));
    setStep('requirements');
    setIsActive(true);
  }, [userEmail]);

  const addFiles = useCallback((files: File[]) => {
    if (!files.length) return;
    setOrder(prev => ({ ...prev, files: [...files, ...prev.files] }));
    setStep('files');
    setIsActive(true);
  }, []);

  const finish = useCallback(() => {
    localStorage.removeItem(STORAGE.orderDraft);
    setOrder(blankOrder(userEmail));
    setStep('requirements');
    setIsActive(false);
  }, [userEmail]);

  return { order, setOrder, step, setStep, isActive, setIsActive, startFresh, addFiles, finish };
};

export type OrderDraft = ReturnType<typeof useOrderDraft>;
