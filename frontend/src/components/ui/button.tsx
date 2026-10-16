import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cx } from "../../utils/theme"

const buttonVariants = cva(
  "inline-flex cursor-pointer select-none items-center justify-center whitespace-nowrap font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/25 focus-visible:ring-offset-2 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 disabled:active:scale-100",
  {
    variants: {
      variant: {
        default:
          "border border-transparent bg-[var(--color-text-primary,#0A0A0B)] text-white shadow-[0_8px_24px_rgba(0,0,0,0.12)] hover:bg-black hover:shadow-[0_12px_28px_rgba(0,0,0,0.18)]",
        brand:
          "border border-transparent bg-[var(--brand,#E97451)] text-white shadow-[0_8px_24px_rgba(233,116,81,0.22)] hover:bg-[var(--brand-hover,#D66140)] hover:shadow-[0_12px_28px_rgba(233,116,81,0.32)]",
        brandWhite:
          "border border-[var(--brand,#E97451)] bg-white text-[var(--brand,#E97451)] hover:bg-[var(--brand,#E97451)] hover:text-white transition-colors duration-200 shadow-sm",
        white:
          "border border-black/10 bg-white text-[var(--color-text-primary,#0A0A0B)] shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:border-black/20 hover:bg-[var(--color-bg-secondary,#F8F9FD)]",
        secondary:
          "border border-black/10 bg-white text-[var(--color-text-primary,#0A0A0B)] hover:border-black/20 hover:bg-[var(--color-bg-secondary,#F8F9FD)] shadow-sm",
        outline:
          "border border-black/15 bg-transparent text-[var(--color-text-primary,#0A0A0B)] hover:border-black/30 hover:bg-black/[0.03]",
        ghost:
          "border border-transparent bg-transparent text-[var(--color-text-primary,#0A0A0B)] hover:bg-black/[0.05]",
        link:
          "border-none bg-transparent text-[var(--brand,#E97451)] underline-offset-4 hover:underline p-0 h-auto active:scale-100",
        destructive:
          "border border-transparent bg-red-600 text-white shadow-[0_4px_16px_rgba(220,38,38,0.2)] hover:bg-red-700",
      },
      size: {
        xs: "h-8 px-3 text-[12px] gap-1.5",
        sm: "h-9 px-4 text-[13px] gap-1.5",
        default: "h-12 px-6 py-2 text-[14px] sm:text-[15px] gap-2",
        compact: "px-5 py-3 text-[14px] gap-2",
        lg: "h-14 px-8 text-[16px] gap-2.5 font-semibold",
        icon: "h-10 w-10 p-0",
        h10: "h-10 px-5 text-[14px] gap-2",
      },
      shape: {
        pill: "rounded-full",
        rounded: "rounded-xl",
        soft: "rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      shape: "pill",
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      shape,
      asChild = false,
      loading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button"
    const isDisabled = disabled || loading

    return (
      <Comp
        className={cx(buttonVariants({ variant, size, shape, className }))}
        ref={ref}
        disabled={isDisabled}
        aria-busy={loading}
        {...props}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <svg
              className="h-4 w-4 animate-spin text-current"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>{children}</span>
          </span>
        ) : (
          <>
            {leftIcon && <span className="inline-flex shrink-0 items-center">{leftIcon}</span>}
            <span>{children}</span>
            {rightIcon && <span className="inline-flex shrink-0 items-center">{rightIcon}</span>}
          </>
        )}
      </Comp>
    )
  },
)
Button.displayName = "Button"

export { Button, buttonVariants }
