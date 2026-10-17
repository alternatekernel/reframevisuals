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
  "relative w-full rounded-2xl border border-l-[3px] p-4 text-left transition-all duration-200",
  {
    variants: {
      variant: {
        info:        "border-blue-200 border-l-blue-500 bg-blue-50 text-blue-950",
        success:     "border-emerald-200 border-l-emerald-500 bg-emerald-50 text-emerald-950",
        warning:     "border-amber-200 border-l-amber-500 bg-amber-50 text-amber-950",
        destructive: "border-rose-200 border-l-rose-500 bg-rose-50 text-rose-950",
        tip:         "border-black/[0.18] border-l-black/50 bg-black/[0.05] text-[var(--color-text-primary,#0A0A0B)]",
      },
    },
    defaultVariants: {
      variant: "info",
    },
  },
)

const iconContainerVariants = cva(
  "shrink-0 flex h-8 w-8 items-center justify-center rounded-lg",
  {
    variants: {
      variant: {
        info:        "bg-blue-100 text-blue-600",
        success:     "bg-emerald-100 text-emerald-600",
        warning:     "bg-amber-100 text-amber-600",
        destructive: "bg-rose-100 text-rose-600",
        tip:         "bg-black/8 text-[var(--color-text-primary,#0A0A0B)]",
      },
    },
    defaultVariants: { variant: "info" },
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
      info:        <Info className="h-4 w-4" />,
      success:     <CheckCircle2 className="h-4 w-4" />,
      warning:     <AlertTriangle className="h-4 w-4" />,
      destructive: <AlertOctagon className="h-4 w-4" />,
      tip:         <Lightbulb className="h-4 w-4" />,
    }[variant || "info"]

    return (
      <div
        ref={ref}
        role="alert"
        className={cx(alertVariants({ variant, className }))}
        {...props}
      >
        <div className="flex items-start gap-3">
          <div className={iconContainerVariants({ variant })}>
            {icon || defaultIcon}
          </div>
          <div className="flex-1 min-w-0 pr-6">
            {title && (
              <h5 className="font-heading text-[14px] font-semibold leading-tight mb-0.5 text-inherit">
                {title}
              </h5>
            )}
            <div className="text-[13px] leading-relaxed text-inherit opacity-85">
              {children}
            </div>
            {action && <div className="mt-3">{action}</div>}
          </div>
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full text-current opacity-40 hover:opacity-80 hover:bg-black/8 transition-opacity"
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
