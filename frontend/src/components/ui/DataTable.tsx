"use client"

import { useState } from "react"
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table"
import { ArrowUp, ArrowDown } from "lucide-react"
import SearchInput from "./SearchInput"
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table"
import { Button } from "@/components/ui/button"

interface DataTableProps<TData> {
  columns: ColumnDef<TData>[]
  data: TData[]
  onRowClick?: (row: TData) => void
  emptyMessage?: string
  search?: string
  onSearchChange?: (value: string) => void
  searchPlaceholder?: string
  currentPage?: number
  totalPages?: number
  total?: number
  pageSize?: number
  onPageChange?: (page: number) => void
}

export default function DataTable<TData>({
  columns,
  data,
  onRowClick,
  emptyMessage = "No data found.",
  search,
  onSearchChange,
  searchPlaceholder = "Search...",
  currentPage,
  totalPages,
  total,
  pageSize,
  onPageChange,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const showPagination = currentPage !== undefined && totalPages !== undefined && total !== undefined && pageSize !== undefined && onPageChange

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  if (data.length === 0) {
    return <div className="py-8 text-center text-muted-foreground">{emptyMessage}</div>
  }

  const from = currentPage ? (currentPage - 1) * (pageSize ?? 10) + 1 : 0
  const to = currentPage ? Math.min(currentPage * (pageSize ?? 10), total ?? 0) : 0

  function renderPages() {
    if (!totalPages) return []
    const pages: (number | string)[] = []
    const delta = 2
    const left = Math.max(2, currentPage! - delta)
    const right = Math.min(totalPages - 1, currentPage! + delta)
    pages.push(1)
    if (left > 2) pages.push("...")
    for (let i = left; i <= right; i++) pages.push(i)
    if (right < totalPages - 1) pages.push("...")
    if (totalPages > 1) pages.push(totalPages)
    return pages
  }

  return (
    <div className="p-3">
      {search !== undefined && onSearchChange && (
        <div className="flex justify-end mb-2">
          <div className="w-56">
            <SearchInput value={search} onChange={onSearchChange} placeholder={searchPlaceholder} />
          </div>
        </div>
      )}

      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const canSort = header.column.getCanSort()
                return (
                  <TableHead
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    className={`bg-[#F7F9FC] ${canSort ? "cursor-pointer select-none" : ""}`}
                  >
                    <div className="flex items-center gap-1">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getIsSorted() === "asc" && <ArrowUp className="h-3 w-3 text-orange-500" />}
                      {header.column.getIsSorted() === "desc" && <ArrowDown className="h-3 w-3 text-orange-500" />}
                    </div>
                  </TableHead>
                )
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow
              key={row.id}
              className={onRowClick ? "cursor-pointer hover:bg-gray-50" : ""}
              onClick={() => onRowClick?.(row.original)}
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {showPagination && totalPages! > 1 && (
        <div className="flex items-center justify-between border-t border-stroke px-1 pt-3">
          <span className="text-xs text-muted-foreground">
            {from}–{to} of {total}
          </span>
          <nav className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon-xs"
              onClick={() => onPageChange!(currentPage! - 1)}
              disabled={currentPage! <= 1}
            >
              ‹
            </Button>
            {renderPages().map((page, i) =>
              typeof page === "string" ? (
                <span key={`ellipsis-${i}`} className="px-1 text-xs text-muted-foreground">…</span>
              ) : (
                <Button
                  key={page}
                  variant={page === currentPage ? "default" : "outline"}
                  size="icon-xs"
                  onClick={() => onPageChange!(page)}
                >
                  {page}
                </Button>
              )
            )}
            <Button
              variant="outline"
              size="icon-xs"
              onClick={() => onPageChange!(currentPage! + 1)}
              disabled={currentPage! >= totalPages!}
            >
              ›
            </Button>
          </nav>
        </div>
      )}
    </div>
  )
}
