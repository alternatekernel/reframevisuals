import * as React from "react"
import { ArrowUpRight, ArrowDownRight } from "lucide-react"
import { cx } from "../../utils/theme"

export interface StatWidgetProps {
  label: string
  value: React.ReactNode
  change?: string
  trend?: "up" | "down" | "neutral"
  caption?: string
  icon?: React.ReactNode
  variant?: "card" | "bordered" | "minimal"
  className?: string
}

export const StatWidget: React.FC<StatWidgetProps> = ({
  label,
  value,
  change,
  trend = "up",
  caption,
  icon,
  variant = "card",
  className,
}) => {
  const variantStyles = {
    card: "rounded-2xl border border-black/[0.18] bg-white p-5 sm:p-6 shadow-[0_8px_24px_rgba(0,0,0,0.09)]",
    bordered: "rounded-2xl border border-black/[0.20] bg-white p-5 sm:p-6",
    minimal: "p-2",
  }[variant]

  return (
    <div className={cx("text-left transition-all duration-200", variantStyles, className)}>
      <div className="flex items-center justify-between">
        <span className="font-heading text-[12px] font-bold uppercase tracking-[0.1em] text-black/55">
          {label}
        </span>
        {icon && (
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-black/[0.04] text-black/60">
            {icon}
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-3">
        <span className="font-heading text-[28px] sm:text-[34px] font-bold tracking-[-0.04em] text-[var(--color-text-primary,#0A0A0B)] leading-none">
          {value}
        </span>
        {change && (
          <span
            className={cx(
              "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[12px] font-semibold",
              trend === "up"
                ? "bg-emerald-50 text-emerald-700"
                : trend === "down"
                  ? "bg-rose-50 text-rose-700"
                  : "bg-black/5 text-black/60",
            )}
          >
            {trend === "up" && <ArrowUpRight className="h-3 w-3" />}
            {trend === "down" && <ArrowDownRight className="h-3 w-3" />}
            <span>{change}</span>
          </span>
        )}
      </div>

      {caption && (
        <p className="mt-2 text-[12.5px] text-black/50 leading-relaxed">
          {caption}
        </p>
      )}
    </div>
  )
}
