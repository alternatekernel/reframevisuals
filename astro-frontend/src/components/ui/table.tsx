import * as React from "react"
import { cx } from "../../utils/theme"

export const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement> & { zebra?: boolean }
>(({ className, zebra = false, ...props }, ref) => (
  <div className="relative w-full overflow-auto rounded-2xl border border-black/[0.18] bg-white shadow-sm">
    <table
      ref={ref}
      className={cx(
        "w-full caption-bottom text-left text-[13.5px]",
        zebra && "[&_tbody_tr:nth-child(even)]:bg-black/[0.04]",
        className,
      )}
      {...props}
    />
  </div>
))
Table.displayName = "Table"

export const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead
    ref={ref}
    className={cx("border-b border-black/[0.18] bg-black/[0.05]", className)}
    {...props}
  />
))
TableHeader.displayName = "TableHeader"

export const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cx("[&_tr:last-child]:border-0", className)}
    {...props}
  />
))
TableBody.displayName = "TableBody"

export const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cx("border-t border-black/[0.18] bg-black/[0.05] font-medium", className)}
    {...props}
  />
))
TableFooter.displayName = "TableFooter"

export const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cx(
      "border-b border-black/[0.20] transition-colors hover:bg-black/[0.05] data-[state=selected]:bg-black/[0.08]",
      className,
    )}
    {...props}
  />
))
TableRow.displayName = "TableRow"

export const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cx(
      "h-11 px-4 text-left align-middle font-heading text-[12px] font-bold uppercase tracking-[0.06em] text-black/60 [&:has([role=checkbox])]:pr-0",
      className,
    )}
    {...props}
  />
))
TableHead.displayName = "TableHead"

export const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cx(
      "p-4 align-middle text-[var(--color-text-primary,#0A0A0B)] [&:has([role=checkbox])]:pr-0",
      className,
    )}
    {...props}
  />
))
TableCell.displayName = "TableCell"

export const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cx("mt-4 text-[12px] text-black/50", className)}
    {...props}
  />
))
TableCaption.displayName = "TableCaption"
