import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cx } from "../../utils/theme"

export interface TooltipProps {
  content: React.ReactNode
  children: React.ReactElement
  position?: "top" | "bottom" | "left" | "right"
  delay?: number
  className?: string
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = "top",
  delay = 150,
  className,
}) => {
  const [isVisible, setIsVisible] = React.useState(false)
  const timeoutRef = React.useRef<number | null>(null)

  const show = () => {
    timeoutRef.current = window.setTimeout(() => setIsVisible(true), delay)
  }

  const hide = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setIsVisible(false)
  }

  const positions = {
    top: {
      wrapper: "bottom-full left-1/2 -translate-x-1/2 mb-2",
      arrow: "top-full left-1/2 -translate-x-1/2 border-t-[#0A0A0B] border-l-transparent border-r-transparent border-b-transparent",
    },
    bottom: {
      wrapper: "top-full left-1/2 -translate-x-1/2 mt-2",
      arrow: "bottom-full left-1/2 -translate-x-1/2 border-b-[#0A0A0B] border-l-transparent border-r-transparent border-t-transparent",
    },
    left: {
      wrapper: "right-full top-1/2 -translate-y-1/2 mr-2",
      arrow: "left-full top-1/2 -translate-y-1/2 border-l-[#0A0A0B] border-t-transparent border-b-transparent border-r-transparent",
    },
    right: {
      wrapper: "left-full top-1/2 -translate-y-1/2 ml-2",
      arrow: "right-full top-1/2 -translate-y-1/2 border-r-[#0A0A0B] border-t-transparent border-b-transparent border-l-transparent",
    },
  }[position]

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            role="tooltip"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={cx(
              "pointer-events-none absolute z-50 whitespace-nowrap rounded-lg bg-[#0A0A0B] px-2.5 py-1.5 text-[12px] font-medium text-white shadow-lg",
              positions.wrapper,
              className,
            )}
          >
            {content}
            <div
              className={cx(
                "absolute h-0 w-0 border-4",
                positions.arrow,
              )}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
