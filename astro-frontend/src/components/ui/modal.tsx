import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"
import { cx } from "../../utils/theme"

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: React.ReactNode
  description?: React.ReactNode
  children: React.ReactNode
  size?: "sm" | "md" | "lg" | "xl"
  showCloseButton?: boolean
  className?: string
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = "md",
  showCloseButton = true,
  className,
}) => {
  // Close on Escape key press
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose()
      }
    }
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown)
      document.body.style.overflow = "hidden"
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = "unset"
    }
  }, [isOpen, onClose])

  const sizeClasses = {
    sm: "max-w-[420px]",
    md: "max-w-[540px]",
    lg: "max-w-[720px]",
    xl: "max-w-[960px]",
  }[size]

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", duration: 0.35, bounce: 0.15 }}
            className={cx(
              "relative z-10 w-full overflow-hidden rounded-2xl border border-black/[0.18] bg-white p-6 sm:p-7 shadow-[0_24px_64px_rgba(0,0,0,0.2)] text-left",
              sizeClasses,
              className,
            )}
          >
            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className="absolute right-4.5 top-4.5 flex h-8 w-8 items-center justify-center rounded-full text-black/50 transition-colors hover:bg-black/5 hover:text-black focus:outline-none"
                aria-label="Close dialog"
              >
                <X className="h-4 w-4" />
              </button>
            )}

            {(title || description) && (
              <div className="mb-5 pr-8">
                {title && (
                  <h3 className="font-heading text-[20px] sm:text-[22px] font-semibold tracking-[-0.03em] text-[var(--color-text-primary,#0A0A0B)]">
                    {title}
                  </h3>
                )}
                {description && (
                  <p className="mt-1 text-[14px] text-black/60 leading-relaxed">
                    {description}
                  </p>
                )}
              </div>
            )}

            <div className="text-[14px] text-[var(--color-text-primary,#0A0A0B)]">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export const ModalHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => <div className={cx("mb-4", className)} {...props} />

export const ModalBody: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => <div className={cx("space-y-4", className)} {...props} />

export const ModalFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => (
  <div
    className={cx(
      "mt-6 flex flex-wrap items-center justify-end gap-3 border-t border-black/[0.16] pt-4",
      className,
    )}
    {...props}
  />
)
