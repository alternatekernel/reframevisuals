import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown } from "lucide-react"
import { cx } from "../../utils/theme"

interface AccordionContextType {
  openItems: string[]
  toggleItem: (id: string) => void
}

const AccordionContext = React.createContext<AccordionContextType | null>(null)

export interface AccordionProps {
  allowMultiple?: boolean
  defaultOpen?: string[]
  children: React.ReactNode
  className?: string
}

export const Accordion: React.FC<AccordionProps> = ({
  allowMultiple = false,
  defaultOpen = [],
  children,
  className,
}) => {
  const [openItems, setOpenItems] = React.useState<string[]>(defaultOpen)

  const toggleItem = (id: string) => {
    setOpenItems((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id)
      } else {
        return allowMultiple ? [...prev, id] : [id]
      }
    })
  }

  return (
    <AccordionContext.Provider value={{ openItems, toggleItem }}>
      <div className={cx("space-y-3 text-left", className)}>{children}</div>
    </AccordionContext.Provider>
  )
}

export interface AccordionItemProps {
  id: string
  children: React.ReactNode
  className?: string
}

export const AccordionItem: React.FC<AccordionItemProps> = ({
  id,
  children,
  className,
}) => {
  return (
    <div
      data-accordion-id={id}
      className={cx(
        "rounded-2xl border border-black/[0.18] bg-white transition-colors duration-200 overflow-hidden",
        className,
      )}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<{ itemId?: string }>, {
            itemId: id,
          })
        }
        return child
      })}
    </div>
  )
}

export interface AccordionTriggerProps {
  itemId?: string
  children: React.ReactNode
  icon?: React.ReactNode
  className?: string
}

export const AccordionTrigger: React.FC<AccordionTriggerProps> = ({
  itemId = "",
  children,
  icon,
  className,
}) => {
  const context = React.useContext(AccordionContext)
  if (!context) throw new Error("AccordionTrigger must be used inside Accordion")

  const isOpen = context.openItems.includes(itemId)

  return (
    <button
      type="button"
      onClick={() => context.toggleItem(itemId)}
      aria-expanded={isOpen}
      className={cx(
        "flex w-full items-center justify-between px-5 py-4 text-left font-medium transition-colors hover:bg-black/[0.04]",
        className,
      )}
    >
      <span className="flex items-center gap-3">
        {icon && <span className="shrink-0 text-[var(--brand,#E97451)]">{icon}</span>}
        <span className="font-heading text-[15px] sm:text-[16px] font-semibold text-[var(--color-text-primary,#0A0A0B)]">
          {children}
        </span>
      </span>
      <motion.span
        animate={{ rotate: isOpen ? 180 : 0 }}
        transition={{ duration: 0.2 }}
        className="ml-3 shrink-0 text-black/40"
      >
        <ChevronDown className="h-4 w-4" />
      </motion.span>
    </button>
  )
}

export interface AccordionContentProps {
  itemId?: string
  children: React.ReactNode
  className?: string
}

export const AccordionContent: React.FC<AccordionContentProps> = ({
  itemId = "",
  children,
  className,
}) => {
  const context = React.useContext(AccordionContext)
  if (!context) throw new Error("AccordionContent must be used inside Accordion")

  const isOpen = context.openItems.includes(itemId)

  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className="overflow-hidden"
        >
          <div
            className={cx(
              "border-t border-black/[0.20] px-5 pb-5 pt-3 text-[14px] text-black/65 leading-relaxed",
              className,
            )}
          >
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
