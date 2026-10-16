import * as React from "react"
import { cx } from "../../utils/theme"
import { X, ChevronDown, AlertCircle } from "lucide-react"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  shape?: "rounded" | "pill"
  clearable?: boolean
  onClear?: () => void
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      shape = "rounded",
      clearable = false,
      onClear,
      value,
      disabled,
      id,
      ...props
    },
    ref,
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined)
    const hasValue = value !== undefined && value !== ""

    return (
      <div className="w-full text-left">
        {label && (
          <label
            htmlFor={inputId}
            className="mb-1.5 block text-[13px] font-medium text-[var(--color-text-primary,#0A0A0B)]"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="pointer-events-none absolute left-3.5 flex items-center text-black/40">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            value={value}
            disabled={disabled}
            className={cx(
              "w-full border bg-white text-[14px] text-[var(--color-text-primary,#0A0A0B)] transition-all duration-200 outline-none placeholder:text-black/35 focus:ring-2 focus:ring-black/10 disabled:cursor-not-allowed disabled:bg-black/[0.02] disabled:opacity-60",
              shape === "pill"
                ? "h-12 rounded-full px-5"
                : "h-11 rounded-xl px-3.5",
              leftIcon && (shape === "pill" ? "pl-11" : "pl-10"),
              (rightIcon || (clearable && hasValue)) &&
                (shape === "pill" ? "pr-11" : "pr-10"),
              error
                ? "border-red-500 focus:border-red-600 focus:ring-red-500/20"
                : "border-black/12 focus:border-black/30",
              className,
            )}
            {...props}
          />
          {clearable && hasValue && !disabled && (
            <button
              type="button"
              onClick={onClear}
              className="absolute right-3.5 flex h-5 w-5 items-center justify-center rounded-full text-black/40 hover:bg-black/5 hover:text-black/70"
              aria-label="Clear input"
            >
              <X className="h-3 w-3" />
            </button>
          )}
          {rightIcon && !(clearable && hasValue) && (
            <div className="pointer-events-none absolute right-3.5 flex items-center text-black/40">
              {rightIcon}
            </div>
          )}
        </div>
        {error ? (
          <p className="mt-1.5 flex items-center gap-1 text-[12px] text-red-600">
            <AlertCircle className="h-3 w-3 shrink-0" />
            <span>{error}</span>
          </p>
        ) : helperText ? (
          <p className="mt-1.5 text-[12px] text-black/50">{helperText}</p>
        ) : null}
      </div>
    )
  },
)
Input.displayName = "Input"

export interface TextAreaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  helperText?: string
  showCount?: boolean
}

export const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      showCount = false,
      maxLength,
      value,
      disabled,
      id,
      ...props
    },
    ref,
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined)
    const currentLength = typeof value === "string" ? value.length : 0

    return (
      <div className="w-full text-left">
        <div className="mb-1.5 flex items-center justify-between">
          {label && (
            <label
              htmlFor={inputId}
              className="block text-[13px] font-medium text-[var(--color-text-primary,#0A0A0B)]"
            >
              {label}
            </label>
          )}
          {showCount && maxLength && (
            <span className="text-[11px] text-black/40">
              {currentLength}/{maxLength}
            </span>
          )}
        </div>
        <textarea
          ref={ref}
          id={inputId}
          value={value}
          maxLength={maxLength}
          disabled={disabled}
          className={cx(
            "w-full rounded-xl border bg-white p-3.5 text-[14px] text-[var(--color-text-primary,#0A0A0B)] transition-all duration-200 outline-none placeholder:text-black/35 focus:ring-2 focus:ring-black/10 disabled:cursor-not-allowed disabled:bg-black/[0.02] disabled:opacity-60",
            error
              ? "border-red-500 focus:border-red-600 focus:ring-red-500/20"
              : "border-black/12 focus:border-black/30",
            className,
          )}
          {...props}
        />
        {error ? (
          <p className="mt-1.5 flex items-center gap-1 text-[12px] text-red-600">
            <AlertCircle className="h-3 w-3 shrink-0" />
            <span>{error}</span>
          </p>
        ) : helperText ? (
          <p className="mt-1.5 text-[12px] text-black/50">{helperText}</p>
        ) : null}
      </div>
    )
  },
)
TextArea.displayName = "TextArea"

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  helperText?: string
  options?: { value: string; label: string; disabled?: boolean }[]
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    { className, label, error, helperText, options = [], children, id, ...props },
    ref,
  ) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined)

    return (
      <div className="w-full text-left">
        {label && (
          <label
            htmlFor={selectId}
            className="mb-1.5 block text-[13px] font-medium text-[var(--color-text-primary,#0A0A0B)]"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={cx(
              "h-11 w-full appearance-none rounded-xl border bg-white pl-3.5 pr-10 text-[14px] text-[var(--color-text-primary,#0A0A0B)] transition-all duration-200 outline-none focus:ring-2 focus:ring-black/10 disabled:cursor-not-allowed disabled:opacity-60",
              error
                ? "border-red-500 focus:border-red-600 focus:ring-red-500/20"
                : "border-black/12 focus:border-black/30",
              className,
            )}
            {...props}
          >
            {options.length > 0
              ? options.map((opt) => (
                  <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                    {opt.label}
                  </option>
                ))
              : children}
          </select>
          <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-black/40">
            <ChevronDown className="h-4 w-4" />
          </div>
        </div>
        {error ? (
          <p className="mt-1.5 flex items-center gap-1 text-[12px] text-red-600">
            <AlertCircle className="h-3 w-3 shrink-0" />
            <span>{error}</span>
          </p>
        ) : helperText ? (
          <p className="mt-1.5 text-[12px] text-black/50">{helperText}</p>
        ) : null}
      </div>
    )
  },
)
Select.displayName = "Select"
