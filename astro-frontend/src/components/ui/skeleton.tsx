import * as React from "react"
import { cx } from "../../utils/theme"

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "rectangular" | "circular" | "text"
  width?: string | number
  height?: string | number
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = "rectangular",
  width,
  height,
  style,
  ...props
}) => {
  const variantClasses = {
    rectangular: "rounded-xl",
    circular: "rounded-full",
    text: "h-4 rounded-md w-full",
  }[variant]

  const customStyle: React.CSSProperties = {
    ...style,
    width: width !== undefined ? width : undefined,
    height: height !== undefined ? height : undefined,
  }

  return (
    <div
      aria-hidden="true"
      className={cx(
        "animate-pulse bg-black/[0.08]",
        variantClasses,
        className,
      )}
      style={customStyle}
      {...props}
    />
  )
}

export interface ProgressBarProps {
  value: number // 0 to 100
  size?: "sm" | "md" | "lg"
  color?: string
  showLabel?: boolean
  className?: string
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  size = "md",
  color,
  showLabel = false,
  className,
}) => {
  const clampedValue = Math.min(100, Math.max(0, value))

  const heightClasses = {
    sm: "h-1.5",
    md: "h-2.5",
    lg: "h-4",
  }[size]

  return (
    <div className={cx("w-full text-left", className)}>
      {showLabel && (
        <div className="mb-1 flex justify-between text-[12px] font-medium text-black/60">
          <span>Progress</span>
          <span>{Math.round(clampedValue)}%</span>
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={clampedValue}
        aria-valuemin={0}
        aria-valuemax={100}
        className={cx(
          "w-full overflow-hidden rounded-full bg-black/[0.08]",
          heightClasses,
        )}
      >
        <div
          className="h-full rounded-full transition-all duration-300 ease-out"
          style={{
            width: `${clampedValue}%`,
            backgroundColor: color || "var(--brand, #E97451)",
          }}
        />
      </div>
    </div>
  )
}
