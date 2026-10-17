import * as React from "react"
import { cx } from "../../utils/theme"
import { Check, Minus } from "lucide-react"

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "onChange"> {
  checked?: boolean
  indeterminate?: boolean
  onCheckedChange?: (checked: boolean) => void
  label?: React.ReactNode
  description?: React.ReactNode
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      className,
      checked = false,
      indeterminate = false,
      onCheckedChange,
      label,
      description,
      disabled,
      id,
      ...props
    },
    ref,
  ) => {
    const inputId = id || (typeof label === "string" ? label.toLowerCase().replace(/\s+/g, "-") : undefined)

    const handleClick = () => {
      if (!disabled && onCheckedChange) {
        onCheckedChange(!checked)
      }
    }

    return (
      <div className={cx("inline-flex items-start gap-2.5", disabled && "opacity-50 cursor-not-allowed", className)}>
        <button
          type="button"
          role="checkbox"
          aria-checked={indeterminate ? "mixed" : checked}
          disabled={disabled}
          id={inputId}
          onClick={handleClick}
          className={cx(
            "relative mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-[5px] border transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 focus-visible:ring-offset-2",
            checked || indeterminate
              ? "border-[var(--brand,#E97451)] bg-[var(--brand,#E97451)] text-white shadow-sm"
              : "border-black/25 bg-white hover:border-black/40",
            disabled ? "cursor-not-allowed" : "cursor-pointer",
          )}
        >
          {indeterminate ? (
            <Minus className="h-3 w-3 stroke-[3]" />
          ) : checked ? (
            <Check className="h-3 w-3 stroke-[3]" />
          ) : null}
        </button>
        {(label || description) && (
          <div className="flex flex-col text-left select-none">
            {label && (
              <label
                htmlFor={inputId}
                onClick={handleClick}
                className={cx(
                  "text-[14px] font-medium text-[var(--color-text-primary,#0A0A0B)] leading-tight",
                  !disabled && "cursor-pointer",
                )}
              >
                {label}
              </label>
            )}
            {description && (
              <p className="mt-0.5 text-[12px] text-black/50 leading-normal">
                {description}
              </p>
            )}
          </div>
        )}
      </div>
    )
  },
)
Checkbox.displayName = "Checkbox"

export interface SwitchProps {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
  size?: "sm" | "md"
  label?: React.ReactNode
  description?: React.ReactNode
  className?: string
  id?: string
}

export const Switch: React.FC<SwitchProps> = ({
  checked = false,
  onCheckedChange,
  disabled = false,
  size = "md",
  label,
  description,
  className,
  id,
}) => {
  const switchId = id || (typeof label === "string" ? label.toLowerCase().replace(/\s+/g, "-") : undefined)

  const handleToggle = () => {
    if (!disabled && onCheckedChange) {
      onCheckedChange(!checked)
    }
  }

  const isSm = size === "sm"

  return (
    <div className={cx("inline-flex items-center gap-3", disabled && "opacity-50 cursor-not-allowed", className)}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        id={switchId}
        onClick={handleToggle}
        className={cx(
          "relative inline-flex shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 focus-visible:ring-offset-2",
          isSm ? "h-5 w-9" : "h-6 w-11",
          checked ? "bg-[var(--brand,#E97451)]" : "bg-black/15",
          disabled && "cursor-not-allowed",
        )}
      >
        <span
          className={cx(
            "pointer-events-none inline-block transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out",
            isSm
              ? cx("h-4 w-4", checked ? "translate-x-4" : "translate-x-0")
              : cx("h-5 w-5", checked ? "translate-x-5" : "translate-x-0"),
          )}
        />
      </button>
      {(label || description) && (
        <div className="flex flex-col text-left select-none">
          {label && (
            <span
              onClick={handleToggle}
              className={cx(
                "text-[14px] font-medium text-[var(--color-text-primary,#0A0A0B)] leading-tight",
                !disabled && "cursor-pointer",
              )}
            >
              {label}
            </span>
          )}
          {description && (
            <p className="mt-0.5 text-[12px] text-black/50 leading-normal">
              {description}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export interface RadioProps {
  value: string
  checked?: boolean
  onChange?: (value: string) => void
  disabled?: boolean
  label?: React.ReactNode
  description?: React.ReactNode
  name?: string
  className?: string
}

export const Radio: React.FC<RadioProps> = ({
  value,
  checked = false,
  onChange,
  disabled = false,
  label,
  description,
  name,
  className,
}) => {
  const handleClick = () => {
    if (!disabled && onChange) {
      onChange(value)
    }
  }

  return (
    <div
      onClick={handleClick}
      className={cx(
        "inline-flex items-start gap-2.5",
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
        className,
      )}
    >
      <div
        className={cx(
          "relative mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full border transition-all duration-150",
          checked
            ? "border-[var(--brand,#E97451)] bg-white"
            : "border-black/25 bg-white hover:border-black/40",
        )}
      >
        {checked && (
          <span className="h-2 w-2 rounded-full bg-[var(--brand,#E97451)]" />
        )}
      </div>
      {(label || description) && (
        <div className="flex flex-col text-left select-none">
          {label && (
            <span className="text-[14px] font-medium text-[var(--color-text-primary,#0A0A0B)] leading-tight">
              {label}
            </span>
          )}
          {description && (
            <p className="mt-0.5 text-[12px] text-black/50 leading-normal">
              {description}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
