import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"
import { cx } from "../../utils/theme"

export interface DrawerProps {
  isOpen: boolean
  onClose: () => void
  title?: React.ReactNode
  description?: React.ReactNode
  children: React.ReactNode
  placement?: "right" | "left" | "bottom"
  size?: "sm" | "md" | "lg"
  className?: string
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  placement = "right",
  size = "md",
  className,
}) => {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose()
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

  const placementVariants = {
    right: {
      initial: { x: "100%" },
      animate: { x: 0 },
      exit: { x: "100%" },
      container: "right-0 top-0 bottom-0 h-full",
      size: { sm: "max-w-sm", md: "max-w-md", lg: "max-w-xl" }[size],
    },
    left: {
      initial: { x: "-100%" },
      animate: { x: 0 },
      exit: { x: "-100%" },
      container: "left-0 top-0 bottom-0 h-full",
      size: { sm: "max-w-sm", md: "max-w-md", lg: "max-w-xl" }[size],
    },
    bottom: {
      initial: { y: "100%" },
      animate: { y: 0 },
      exit: { y: "100%" },
      container: "bottom-0 left-0 right-0 max-h-[85vh] rounded-t-2xl",
      size: "w-full",
    },
  }[placement]

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 overflow-hidden"
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

          {/* Drawer Panel */}
          <motion.div
            initial={placementVariants.initial}
            animate={placementVariants.animate}
            exit={placementVariants.exit}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className={cx(
              "fixed z-10 flex flex-col bg-white shadow-2xl text-left",
              placementVariants.container,
              placementVariants.size,
              className,
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-black/8 px-6 py-4.5">
              <div>
                {title && (
                  <h3 className="font-heading text-[18px] font-semibold text-[var(--color-text-primary,#0A0A0B)]">
                    {title}
                  </h3>
                )}
                {description && (
                  <p className="mt-0.5 text-[13px] text-black/50">{description}</p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full text-black/50 hover:bg-black/5 hover:text-black focus:outline-none"
                aria-label="Close drawer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 text-[14px]">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
