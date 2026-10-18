import * as React from "react"
import { cx } from "../../utils/theme"

const AVATAR_COLORS = [
  "bg-blue-100 text-blue-700",
  "bg-purple-100 text-purple-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-sky-100 text-sky-700",
  "bg-indigo-100 text-indigo-700",
]

function getInitials(name?: string): string {
  if (!name) return ""
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function getColorForName(name?: string): string {
  if (!name) return AVATAR_COLORS[0]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string
  alt?: string
  name?: string
  size?: "xs" | "sm" | "md" | "lg" | "xl"
  status?: "online" | "offline" | "busy" | "away"
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = "",
  name,
  size = "md",
  status,
  className,
  ...props
}) => {
  const [imageError, setImageError] = React.useState(false)

  const sizeClasses = {
    xs: "h-6 w-6 text-[12px]",
    sm: "h-8 w-8 text-[12px]",
    md: "h-10 w-10 text-[14px]",
    lg: "h-12 w-12 text-[16px]",
    xl: "h-16 w-16 text-[20px]",
  }[size]

  const statusSizeClasses = {
    xs: "h-1.5 w-1.5",
    sm: "h-2 w-2",
    md: "h-2.5 w-2.5",
    lg: "h-3 w-3",
    xl: "h-3.5 w-3.5",
  }[size]

  const statusColorClasses = {
    online: "bg-emerald-500",
    busy: "bg-rose-500",
    away: "bg-amber-500",
    offline: "bg-zinc-400",
  }

  const initials = getInitials(name)
  const colorClass = getColorForName(name)

  return (
    <div
      className={cx(
        "relative inline-flex shrink-0 items-center justify-center rounded-full font-semibold select-none ring-2 ring-white overflow-visible",
        sizeClasses,
        colorClass,
        className,
      )}
      {...props}
    >
      {src && !imageError ? (
        <img
          src={src}
          alt={alt || name || "Avatar"}
          onError={() => setImageError(true)}
          className="h-full w-full rounded-full object-cover"
        />
      ) : (
        <span>{initials || "•"}</span>
      )}

      {status && (
        <span
          className={cx(
            "absolute bottom-0 right-0 rounded-full ring-2 ring-white",
            statusSizeClasses,
            statusColorClasses[status],
          )}
        />
      )}
    </div>
  )
}

export interface AvatarGroupProps {
  children: React.ReactNode
  max?: number
  size?: "xs" | "sm" | "md" | "lg"
  className?: string
}

export const AvatarGroup: React.FC<AvatarGroupProps> = ({
  children,
  max = 4,
  size = "md",
  className,
}) => {
  const childArray = React.Children.toArray(children)
  const visibleAvatars = childArray.slice(0, max)
  const excess = childArray.length - max

  const excessSizeClasses = {
    xs: "h-6 w-6 text-[12px]",
    sm: "h-8 w-8 text-[12px]",
    md: "h-10 w-10 text-[12px]",
    lg: "h-12 w-12 text-[14px]",
  }[size]

  return (
    <div className={cx("inline-flex items-center -space-x-2.5", className)}>
      {visibleAvatars.map((child, index) => (
        <div key={index} className="relative transition-transform hover:z-10 hover:scale-105">
          {child}
        </div>
      ))}
      {excess > 0 && (
        <div
          className={cx(
            "relative flex items-center justify-center rounded-full bg-zinc-800 text-white font-medium ring-2 ring-white shadow-sm",
            excessSizeClasses,
          )}
        >
          +{excess}
        </div>
      )}
    </div>
  )
}
