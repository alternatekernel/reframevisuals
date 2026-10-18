import * as React from "react"
import { cx } from "../../utils/theme"
import { X, ChevronDown, AlertCircle } from "lucide-react"

// ─── Shared base classes ────────────────────────────────────────────────────
const fieldBase =
  "w-full border bg-white text-[13.5px] text-[var(--color-text-primary,#0A0A0B)] shadow-sm transition-all duration-200 outline-none " +
  "placeholder:text-black/30 " +
  "border-black/[0.13] hover:border-black/25 " +
  "focus:border-[var(--brand,#0A0A0B)]/35 focus:ring-2 focus:ring-[var(--brand,#0A0A0B)]/8 " +
  "disabled:cursor-not-allowed disabled:bg-black/[0.04] disabled:opacity-60"

const fieldError =
  "border-rose-400 hover:border-rose-500 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/15"

const labelBase =
  "mb-1.5 block text-[12.5px] font-semibold tracking-wide text-[var(--color-text-primary,#0A0A0B)] uppercase"

const helperBase = "mt-1.5 text-[12px] leading-relaxed text-black/45"

// ─── Input ──────────────────────────────────────────────────────────────────
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
          <label htmlFor={inputId} className={labelBase}>
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="pointer-events-none absolute left-3.5 flex items-center text-black/35">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            value={value}
            disabled={disabled}
            className={cx(
              fieldBase,
              error ? fieldError : "",
              shape === "pill" ? "h-12 rounded-full px-5" : "h-10 rounded-xl px-3.5",
              leftIcon && (shape === "pill" ? "pl-11" : "pl-10"),
              (rightIcon || (clearable && hasValue)) &&
                (shape === "pill" ? "pr-11" : "pr-10"),
              className,
            )}
            {...props}
          />
          {clearable && hasValue && !disabled && (
            <button
              type="button"
              onClick={onClear}
              className="absolute right-3.5 flex h-5 w-5 items-center justify-center rounded-full text-black/30 hover:bg-black/6 hover:text-black/60 transition-colors"
              aria-label="Clear input"
            >
              <X className="h-3 w-3" />
            </button>
          )}
          {rightIcon && !(clearable && hasValue) && (
            <div className="pointer-events-none absolute right-3.5 flex items-center text-black/35">
              {rightIcon}
            </div>
          )}
        </div>
        {error ? (
          <p className="mt-1.5 flex items-center gap-1 text-[12px] text-rose-600 font-medium">
            <AlertCircle className="h-3 w-3 shrink-0" />
            <span>{error}</span>
          </p>
        ) : helperText ? (
          <p className={helperBase}>{helperText}</p>
        ) : null}
      </div>
    )
  },
)
Input.displayName = "Input"

// ─── TextArea ───────────────────────────────────────────────────────────────
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
            <label htmlFor={inputId} className={labelBase}>
              {label}
            </label>
          )}
          {showCount && maxLength && (
            <span className="text-[12px] font-medium tabular-nums text-black/35">
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
            fieldBase,
            "rounded-xl p-3.5 resize-none leading-relaxed",
            error ? fieldError : "",
            className,
          )}
          {...props}
        />
        {error ? (
          <p className="mt-1.5 flex items-center gap-1 text-[12px] text-rose-600 font-medium">
            <AlertCircle className="h-3 w-3 shrink-0" />
            <span>{error}</span>
          </p>
        ) : helperText ? (
          <p className={helperBase}>{helperText}</p>
        ) : null}
      </div>
    )
  },
)
TextArea.displayName = "TextArea"

// ─── Select ─────────────────────────────────────────────────────────────────
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
          <label htmlFor={selectId} className={labelBase}>
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={cx(
              fieldBase,
              "h-10 appearance-none rounded-xl pl-3.5 pr-10 cursor-pointer",
              error ? fieldError : "",
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
          <p className="mt-1.5 flex items-center gap-1 text-[12px] text-rose-600 font-medium">
            <AlertCircle className="h-3 w-3 shrink-0" />
            <span>{error}</span>
          </p>
        ) : helperText ? (
          <p className={helperBase}>{helperText}</p>
        ) : null}
      </div>
    )
  },
)
Select.displayName = "Select"
