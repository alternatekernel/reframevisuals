import * as React from "react"
import { ChevronRight, Home } from "lucide-react"
import { Link } from "react-router-dom"
import { cx } from "../../utils/theme"

export interface BreadcrumbItem {
  label: React.ReactNode
  href?: string
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[]
  showHome?: boolean
  separator?: React.ReactNode
  className?: string
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  items,
  showHome = true,
  separator = <ChevronRight className="h-3.5 w-3.5 text-black/30 shrink-0" />,
  className,
}) => {
  return (
    <nav aria-label="Breadcrumb" className={cx("flex items-center text-[13px]", className)}>
      <ol className="flex flex-wrap items-center gap-1.5 text-black/60">
        {showHome && (
          <li className="inline-flex items-center">
            <Link
              to="/"
              className="flex items-center text-black/50 hover:text-black transition-colors"
              aria-label="Home"
            >
              <Home className="h-3.5 w-3.5" />
            </Link>
          </li>
        )}

        {showHome && items.length > 0 && (
          <li aria-hidden="true" className="flex items-center">
            {separator}
          </li>
        )}

        {items.map((item, index) => {
          const isLast = index === items.length - 1
          return (
            <React.Fragment key={index}>
              <li className="inline-flex items-center">
                {isLast || !item.href ? (
                  <span
                    className="font-medium text-[var(--color-text-primary,#0A0A0B)] select-none"
                    aria-current={isLast ? "page" : undefined}
                  >
                    {item.label}
                  </span>
                ) : (
                  <Link
                    to={item.href}
                    className="text-black/60 hover:text-black transition-colors"
                  >
                    {item.label}
                  </Link>
                )}
              </li>
              {!isLast && (
                <li aria-hidden="true" className="flex items-center">
                  {separator}
                </li>
              )}
            </React.Fragment>
          )
        })}
      </ol>
    </nav>
  )
}
