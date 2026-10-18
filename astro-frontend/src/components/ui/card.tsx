import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cx } from "../../utils/theme"

const cardVariants = cva(
  "rounded-2xl transition-all duration-200 text-left overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border border-black/[0.16] bg-white text-[var(--color-text-primary,#0A0A0B)] shadow-[0_8px_24px_rgba(0,0,0,0.09)]",
        bordered:
          "border border-black/[0.20] bg-white text-[var(--color-text-primary,#0A0A0B)] shadow-none",
        elevated:
          "border border-black/[0.14] bg-white text-[var(--color-text-primary,#0A0A0B)] shadow-[0_16px_40px_rgba(0,0,0,0.13)]",
        interactive:
          "border border-black/[0.16] bg-white text-[var(--color-text-primary,#0A0A0B)] shadow-[0_8px_24px_rgba(0,0,0,0.09)] hover:-translate-y-1 hover:border-black/[0.28] hover:shadow-[0_20px_48px_rgba(0,0,0,0.14)] cursor-pointer",
        glass:
          "border border-white/60 bg-white/70 backdrop-blur-md text-[var(--color-text-primary,#0A0A0B)] shadow-[0_8px_32px_rgba(0,0,0,0.10)]",
        inset:
          "border border-black/[0.14] bg-[var(--color-bg-secondary,#F8F9FD)] text-[var(--color-text-primary,#0A0A0B)]",
        dark:
          "border border-white/10 bg-[#0A0A0B] text-white shadow-[0_18px_48px_rgba(0,0,0,0.25)]",
      },
      padding: {
        none: "p-0",
        sm: "p-4 sm:p-5",
        default: "p-6 sm:p-7",
        lg: "p-8 sm:p-10",
      },
    },
    defaultVariants: {
      variant: "default",
      padding: "default",
    },
  },
)

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, ...props }, ref) => (
    <div
      ref={ref}
      className={cx(cardVariants({ variant, padding, className }))}
      {...props}
    />
  ),
)
Card.displayName = "Card"

export const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cx("flex flex-col space-y-1.5", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

export const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, children, ...props }, ref) => (
  <h3
    ref={ref}
    className={cx(
      "font-heading text-[18px] sm:text-[20px] font-semibold leading-tight tracking-[-0.03em] text-inherit",
      className,
    )}
    {...props}
  >
    {children}
  </h3>
))
CardTitle.displayName = "CardTitle"

export const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cx("text-[14px] text-black/60 leading-relaxed", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

export const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cx("pt-4", className)} {...props} />
))
CardContent.displayName = "CardContent"

export const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cx("flex items-center pt-5", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"
