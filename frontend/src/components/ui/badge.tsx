import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cx } from "../../utils/theme"
import { X } from "lucide-react"

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 whitespace-nowrap font-medium transition-colors select-none",
  {
    variants: {
      variant: {
        default:
          "border border-transparent bg-[var(--color-text-primary,#0A0A0B)] text-white",
        brand:
          "border border-transparent bg-[var(--brand,#E97451)] text-white",
        subtle:
          "border border-[var(--brand,#E97451)]/20 bg-[var(--brand,#E97451)]/10 text-[var(--brand,#E97451)]",
        secondary:
          "border border-black/[0.18] bg-black/[0.04] text-[var(--color-text-primary,#0A0A0B)]",
        outline:
          "border border-black/15 bg-transparent text-[var(--color-text-primary,#0A0A0B)]",
        white:
          "border border-white/20 bg-white/10 text-white backdrop-blur-sm",
        success:
          "border border-emerald-500/20 bg-emerald-50 text-emerald-700",
        warning:
          "border border-amber-500/20 bg-amber-50 text-amber-800",
        destructive:
          "border border-rose-500/20 bg-rose-50 text-rose-700",
        ghost:
          "border border-transparent bg-transparent text-[var(--color-text-secondary,#666666)] hover:bg-black/5",

        // Reframe Visuals Service Category Pills
        catFoundation:
          "border border-orange-500/25 bg-orange-500/10 text-orange-600 font-semibold",
        catEnhancement:
          "border border-sky-500/25 bg-sky-500/10 text-sky-600 font-semibold",
        catRetouch:
          "border border-emerald-500/25 bg-emerald-500/10 text-emerald-600 font-semibold",
        catAdvanced:
          "border border-purple-500/25 bg-purple-500/10 text-purple-600 font-semibold",
      },
      size: {
        sm: "h-5 px-2 text-[12px] rounded-full",
        default: "h-6 px-2.5 text-[12px] rounded-full",
        lg: "h-7 px-3 text-[14px] rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean
  pulse?: boolean
  dotColor?: string
  onDismiss?: () => void
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      className,
      variant,
      size,
      dot = false,
      pulse = false,
      dotColor,
      onDismiss,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <span
        ref={ref}
        className={cx(badgeVariants({ variant, size, className }))}
        {...props}
      >
        {dot && (
          <span className="relative flex h-2 w-2 shrink-0">
            {pulse && (
              <span
                className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
                style={{ backgroundColor: dotColor || "currentColor" }}
              />
            )}
            <span
              className="relative inline-flex h-2 w-2 rounded-full"
              style={{ backgroundColor: dotColor || "currentColor" }}
            />
          </span>
        )}
        <span>{children}</span>
        {onDismiss && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onDismiss()
            }}
            className="ml-0.5 inline-flex h-3.5 w-3.5 items-center justify-center rounded-full hover:bg-black/10 focus:outline-none"
            aria-label="Dismiss badge"
          >
            <X className="h-2.5 w-2.5" />
          </button>
        )}
      </span>
    )
  },
)
Badge.displayName = "Badge"

export { badgeVariants }
