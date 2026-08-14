"use client"

import { Button } from "@/components/ui/button"

interface PaginationProps {
  currentPage: number
  totalPages: number
  total: number
  pageSize: number
  onPageChange: (page: number) => void
}

export default function Pagination({ currentPage, totalPages, total, pageSize, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null

  const from = (currentPage - 1) * pageSize + 1
  const to = Math.min(currentPage * pageSize, total)

  function renderPages() {
    const pages: (number | string)[] = []
    const delta = 2
    const left = Math.max(2, currentPage - delta)
    const right = Math.min(totalPages - 1, currentPage + delta)

    pages.push(1)
    if (left > 2) pages.push("...")
    for (let i = left; i <= right; i++) pages.push(i)
    if (right < totalPages - 1) pages.push("...")
    if (totalPages > 1) pages.push(totalPages)

    return pages
  }

  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">
        Showing {from}–{to} of {total}
      </span>
      <nav aria-label="Pagination" className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon-xs"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
        >
          ‹
        </Button>
        {renderPages().map((page, i) =>
          typeof page === "string" ? (
            <span key={`ellipsis-${i}`} className="px-1 text-xs text-muted-foreground">
              …
            </span>
          ) : (
            <Button
              key={page}
              variant={page === currentPage ? "default" : "outline"}
              size="icon-xs"
              onClick={() => onPageChange(page)}
            >
              {page}
            </Button>
          )
        )}
        <Button
          variant="outline"
          size="icon-xs"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
        >
          ›
        </Button>
      </nav>
    </div>
  )
}
