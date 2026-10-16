import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import {
  Info,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Lightbulb,
  X,
} from "lucide-react"
import { cx } from "../../utils/theme"

const alertVariants = cva(
  "relative w-full rounded-2xl border p-4.5 text-left transition-all duration-200",
  {
    variants: {
      variant: {
        info: "border-blue-500/20 bg-blue-50/80 text-blue-950",
        success: "border-emerald-500/20 bg-emerald-50/80 text-emerald-950",
        warning: "border-amber-500/20 bg-amber-50/80 text-amber-950",
        destructive: "border-rose-500/20 bg-rose-50/80 text-rose-950",
        tip: "border-[var(--brand,#E97451)]/25 bg-[var(--brand,#E97451)]/8 text-[var(--color-text-primary,#0A0A0B)]",
      },
    },
    defaultVariants: {
      variant: "info",
    },
  },
)

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  title?: React.ReactNode
  icon?: React.ReactNode
  onDismiss?: () => void
  action?: React.ReactNode
}

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  (
    {
      className,
      variant = "info",
      title,
      icon,
      onDismiss,
      action,
      children,
      ...props
    },
    ref,
  ) => {
    const defaultIcon = {
      info: <Info className="h-5 w-5 text-blue-600" />,
      success: <CheckCircle2 className="h-5 w-5 text-emerald-600" />,
      warning: <AlertTriangle className="h-5 w-5 text-amber-600" />,
      destructive: <AlertOctagon className="h-5 w-5 text-rose-600" />,
      tip: <Lightbulb className="h-5 w-5 text-[var(--brand,#E97451)]" />,
    }[variant || "info"]

    return (
      <div
        ref={ref}
        role="alert"
        className={cx(alertVariants({ variant, className }))}
        {...props}
      >
        <div className="flex items-start gap-3.5">
          <div className="shrink-0 pt-0.5">{icon || defaultIcon}</div>
          <div className="flex-1 pr-6">
            {title && (
              <h5 className="font-heading text-[15px] font-semibold leading-tight mb-1 text-inherit">
                {title}
              </h5>
            )}
            <div className="text-[13.5px] leading-relaxed text-inherit opacity-90">
              {children}
            </div>
            {action && <div className="mt-3">{action}</div>}
          </div>
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="absolute right-3.5 top-3.5 flex h-6 w-6 items-center justify-center rounded-full text-current opacity-50 hover:opacity-100 hover:bg-black/5"
              aria-label="Dismiss alert"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    )
  },
)
Alert.displayName = "Alert"
