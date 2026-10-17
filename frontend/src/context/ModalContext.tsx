import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

type ModalType = 'alert' | 'confirm';

interface ModalOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'success' | 'info';
  onConfirm?: () => void;
  onCancel?: () => void;
}

interface ModalContextType {
  showAlert: (options: ModalOptions) => void;
  showConfirm: (options: ModalOptions) => Promise<boolean>;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [modal, setModal] = useState<(ModalOptions & { id: string; type: ModalType; resolve?: (val: boolean) => void }) | null>(null);

  const showAlert = useCallback((options: ModalOptions) => {
    setModal({ ...options, id: Math.random().toString(), type: 'alert' });
  }, []);

  const showConfirm = useCallback((options: ModalOptions) => {
    return new Promise<boolean>((resolve) => {
      setModal({ ...options, id: Math.random().toString(), type: 'confirm', resolve });
    });
  }, []);

  const handleClose = useCallback((result: boolean) => {
    if (modal?.resolve) {
      modal.resolve(result);
    }
    if (result && modal?.onConfirm) {
      modal.onConfirm();
    } else if (!result && modal?.onCancel) {
      modal.onCancel();
    }
    setModal(null);
  }, [modal]);

  return (
    <ModalContext.Provider value={{ showAlert, showConfirm }}>
      {children}
      <AnimatePresence>
        {modal && (
          <div data-modal-root className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Static blur layer — never animates, prevents jank on mid-range devices */}
            <div className="absolute inset-0 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => handleClose(false)}
              className="absolute inset-0 bg-black/40"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-borderSubtle"
            >
              <div className="p-8">
                <div className="flex items-start gap-4 mb-6">
                  <div className={`p-3 rounded-2xl ${
                    modal.variant === 'danger' ? 'bg-semantic-error-light text-semantic-error' :
                    modal.variant === 'warning' ? 'bg-semantic-warning-light text-semantic-warning' :
                    modal.variant === 'success' ? 'bg-semantic-success-light text-semantic-success' :
                    'bg-semantic-info-light text-semantic-info'
                  }`}>
                    {modal.variant === 'danger' ? <AlertCircle size={24} /> :
                     modal.variant === 'success' ? <CheckCircle2 size={24} /> :
                     <Info size={24} />}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-20 font-bold text-text-primary mb-2">
                      {modal.title || (modal.type === 'confirm' ? 'Confirm Action' : 'Notice')}
                    </h3>
                    <p className="text-14 text-text-secondary leading-relaxed">
                      {modal.message}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  {modal.type === 'confirm' && (
                    <button
                      onClick={() => handleClose(false)}
                      className="flex-1 px-6 py-3 rounded-xl text-14 font-semibold transition-all hover:bg-black/5 text-text-secondary"
                    >
                      {modal.cancelLabel || 'Cancel'}
                    </button>
                  )}
                  <button
                    onClick={() => handleClose(true)}
                    className={`flex-1 px-6 py-3 rounded-xl text-14 font-semibold transition-all shadow-lg active:scale-[0.98] ${
                      modal.variant === 'danger' ? 'bg-semantic-error hover:opacity-90 text-white' :
                      'bg-text-primary hover:bg-black text-white'
                    }`}
                  >
                    {modal.confirmLabel || (modal.type === 'confirm' ? 'Confirm' : 'Got it')}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </ModalContext.Provider>
  );
};

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) throw new Error('useModal must be used within ModalProvider');
  return context;
};
