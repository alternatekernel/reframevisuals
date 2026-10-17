import * as React from "react"
import { motion } from "framer-motion"
import { cx } from "../../utils/theme"

export interface TabItem {
  id: string
  label: React.ReactNode
  icon?: React.ReactNode
  badge?: React.ReactNode
  disabled?: boolean
}

export interface TabsProps {
  items: TabItem[]
  activeTab: string
  onChange: (tabId: string) => void
  variant?: "pills" | "underline" | "segmented"
  size?: "sm" | "md" | "lg"
  className?: string
}

export const Tabs: React.FC<TabsProps> = ({
  items,
  activeTab,
  onChange,
  variant = "pills",
  size = "md",
  className,
}) => {
  const sizeClasses = {
    sm: "text-[12px] py-1.5 px-3 gap-1.5",
    md: "text-[14px] py-2 px-4 gap-2",
    lg: "text-[15px] py-2.5 px-5 gap-2.5",
  }[size]

  if (variant === "segmented") {
    return (
      <div
        role="tablist"
        className={cx(
          "inline-flex items-center rounded-xl bg-black/[0.05] p-1 border border-black/[0.12] select-none",
          className,
        )}
      >
        {items.map((tab) => {
          const isActive = tab.id === activeTab
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              disabled={tab.disabled}
              onClick={() => !tab.disabled && onChange(tab.id)}
              className={cx(
                "relative flex items-center justify-center font-medium rounded-lg transition-colors duration-150 focus-visible:outline-none",
                sizeClasses,
                isActive
                  ? "text-[var(--color-text-primary,#0A0A0B)] font-semibold"
                  : "text-black/60 hover:text-black/90",
                tab.disabled && "opacity-40 cursor-not-allowed",
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="segmentedTabActive"
                  className="absolute inset-0 rounded-lg bg-white shadow-sm"
                  transition={{ type: "spring", bounce: 0.15, duration: 0.3 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                {tab.icon && <span className="shrink-0">{tab.icon}</span>}
                <span>{tab.label}</span>
                {tab.badge && <span className="shrink-0">{tab.badge}</span>}
              </span>
            </button>
          )
        })}
      </div>
    )
  }

  if (variant === "underline") {
    return (
      <div
        role="tablist"
        className={cx(
          "flex items-center border-b border-black/[0.18] select-none space-x-1 sm:space-x-2",
          className,
        )}
      >
        {items.map((tab) => {
          const isActive = tab.id === activeTab
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              disabled={tab.disabled}
              onClick={() => !tab.disabled && onChange(tab.id)}
              className={cx(
                "relative flex items-center font-medium transition-colors pb-3 pt-2 px-3 focus-visible:outline-none",
                size === "sm" ? "text-[13px]" : "text-[14px] sm:text-[15px]",
                isActive
                  ? "text-[var(--color-text-primary,#0A0A0B)] font-semibold"
                  : "text-black/50 hover:text-black/80",
                tab.disabled && "opacity-40 cursor-not-allowed",
              )}
            >
              <span className="flex items-center gap-2">
                {tab.icon && <span className="shrink-0">{tab.icon}</span>}
                <span>{tab.label}</span>
                {tab.badge && <span className="shrink-0">{tab.badge}</span>}
              </span>
              {isActive && (
                <motion.div
                  layoutId="underlineTabActive"
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--brand,#E97451)]"
                  transition={{ type: "spring", bounce: 0.15, duration: 0.3 }}
                />
              )}
            </button>
          )
        })}
      </div>
    )
  }

  // Pills variant (default)
  return (
    <div
      role="tablist"
      className={cx(
        "flex flex-wrap items-center gap-2 select-none",
        className,
      )}
    >
      {items.map((tab) => {
        const isActive = tab.id === activeTab
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            disabled={tab.disabled}
            onClick={() => !tab.disabled && onChange(tab.id)}
            className={cx(
              "relative flex items-center rounded-full font-medium transition-all duration-200 focus-visible:outline-none active:scale-[0.98]",
              sizeClasses,
              isActive
                ? "bg-[var(--color-text-primary,#0A0A0B)] text-white shadow-sm"
                : "bg-black/[0.04] text-black/70 hover:bg-black/[0.08] hover:text-black",
              tab.disabled && "opacity-40 cursor-not-allowed active:scale-100",
            )}
          >
            <span className="flex items-center gap-1.5">
              {tab.icon && <span className="shrink-0">{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.badge && <span className="shrink-0">{tab.badge}</span>}
            </span>
          </button>
        )
      })}
    </div>
  )
}
