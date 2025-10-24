import * as React from "react"
import { cn } from "@/lib/utils"

// === Table Container ===
const Table = React.forwardRef(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-auto rounded-md border border-[hsl(var(--border))]/20 bg-[hsl(var(--card))]/40 backdrop-blur-sm shadow-sm">
    <table
      ref={ref}
      className={cn(
        "w-full caption-bottom text-sm text-foreground/90 table-auto",
        className
      )}
      {...props}
    />
  </div>
))
Table.displayName = "Table"

// === Header ===
const TableHeader = React.forwardRef(({ className, ...props }, ref) => (
  <thead
    ref={ref}
    className={cn(
      "bg-[hsl(var(--muted))]/40 backdrop-blur-md text-muted-foreground border-b border-[hsl(var(--border))]/30",
      className
    )}
    {...props}
  />
))
TableHeader.displayName = "TableHeader"

// === Body ===
const TableBody = React.forwardRef(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn(
      "divide-y divide-[hsl(var(--border))]/20 text-foreground/90",
      className
    )}
    {...props}
  />
))
TableBody.displayName = "TableBody"

// === Footer ===
const TableFooter = React.forwardRef(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      "border-t border-[hsl(var(--border))]/20 bg-[hsl(var(--muted))]/30 font-medium backdrop-blur-sm",
      className
    )}
    {...props}
  />
))
TableFooter.displayName = "TableFooter"

// === Row ===
const TableRow = React.forwardRef(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "transition-all duration-150  hover:bg-[hsl(var(--muted))]/30 hover:shadow-[0_0_8px_rgba(0,0,0,0.04)] data-[state=selected]:bg-[hsl(var(--primary))]/10",
      className
    )}
    {...props}
  />
))
TableRow.displayName = "TableRow"

// === Head Cell ===
const TableHead = React.forwardRef(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-10 px-3 text-left align-middle font-medium text-muted-foreground tracking-wide whitespace-nowrap",
      className
    )}
    {...props}
  />
))
TableHead.displayName = "TableHead"

// === Cell ===
const TableCell = React.forwardRef(({ className, hug = false, ...props }, ref) => (
  <td
    ref={ref}
    className={cn(
      "p-3 align-middle text-foreground/90",
      hug ? "w-1 whitespace-nowrap text-right" : "w-auto",
      className
    )}
    {...props}
  />
))
TableCell.displayName = "TableCell"

// === Caption ===
const TableCaption = React.forwardRef(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn("mt-4 text-sm text-muted-foreground", className)}
    {...props}
  />
))
TableCaption.displayName = "TableCaption"

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
