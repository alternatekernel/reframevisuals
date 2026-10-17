import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cx } from "../../utils/theme"

const buttonVariants = cva(
  "inline-flex cursor-pointer select-none items-center justify-center whitespace-nowrap font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/25 focus-visible:ring-offset-2 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45 disabled:active:scale-100",
  {
    variants: {
      variant: {
        // ── Filled / solid ──────────────────────────────────────────────
        default:
          "border border-transparent bg-[var(--color-text-primary,#0A0A0B)] text-white shadow-[0_4px_16px_rgba(0,0,0,0.14)] hover:bg-[#1a1a1b] hover:shadow-[0_8px_24px_rgba(0,0,0,0.20)]",
        brand:
          // Live brand token — reflects the token controller; shadows neutral so they work for any brand hue
          "border border-transparent bg-[var(--brand,#0A0A0B)] text-white font-semibold shadow-[0_4px_20px_rgba(0,0,0,0.15)] hover:opacity-90 hover:shadow-[0_8px_28px_rgba(0,0,0,0.22)]",
        destructive:
          "border border-transparent bg-rose-600 text-white shadow-[0_4px_16px_rgba(225,29,72,0.22)] hover:bg-rose-700 hover:shadow-[0_8px_20px_rgba(225,29,72,0.30)]",
        success:
          "border border-transparent bg-emerald-600 text-white shadow-[0_4px_16px_rgba(22,163,74,0.20)] hover:bg-emerald-700",

        // ── Outlined / surface ──────────────────────────────────────────
        brandWhite:
          // Inverted brand: white bg, brand-colored border + text; fills with brand on hover
          "border border-[var(--brand,#0A0A0B)] bg-white text-[var(--brand,#0A0A0B)] shadow-sm hover:bg-[var(--brand,#0A0A0B)] hover:text-white transition-colors duration-200",
        white:
          "border border-black/[0.18] bg-white text-[var(--color-text-primary,#0A0A0B)] shadow-[0_2px_8px_rgba(0,0,0,0.09)] hover:border-black/20 hover:bg-[var(--color-bg-secondary,#F8F9FD)]",
        secondary:
          "border border-black/[0.20] bg-white text-[var(--color-text-primary,#0A0A0B)] hover:border-black/22 hover:bg-black/[0.05] shadow-sm",
        outline:
          "border border-black/15 bg-transparent text-[var(--color-text-primary,#0A0A0B)] hover:border-black/30 hover:bg-black/[0.05]",

        // ── Low-emphasis ────────────────────────────────────────────────
        ghost:
          "border border-transparent bg-transparent text-[var(--color-text-primary,#0A0A0B)] hover:bg-black/[0.05]",
        link:
          "border-none bg-transparent text-[var(--color-text-primary,#0A0A0B)] underline-offset-4 hover:underline p-0 h-auto active:scale-100 font-normal",
      },
      size: {
        xs:      "h-8 px-3 text-[12px] gap-1.5",
        sm:      "h-9 px-4 text-[14px] gap-1.5",
        default: "h-11 px-6 py-2 text-[14px] sm:text-[15px] gap-2",
        compact: "px-5 py-3 text-[14px] gap-2",
        lg:      "h-13 px-8 text-[16px] gap-2.5 font-semibold",
        icon:    "h-10 w-10 p-0",
        h10:     "h-10 px-5 text-[14px] gap-2",
      },
      shape: {
        pill:    "rounded-full",
        rounded: "rounded-xl",
        soft:    "rounded-lg",
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

    // When asChild, pass children directly to Slot so it can merge classes onto the child element.
    if (asChild) {
      return (
        <Slot
          className={cx(buttonVariants({ variant, size, shape, className }))}
          ref={ref}
          aria-busy={loading}
          {...props}
        >
          {children}
        </Slot>
      )
    }

    return (
      <button
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
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
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
      </button>
    )
  },
)
Button.displayName = "Button"

export { Button, buttonVariants }
