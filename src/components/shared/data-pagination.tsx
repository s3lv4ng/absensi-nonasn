'use client'

import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DataPaginationProps {
  /** Current page (1-based) */
  page: number
  /** Total number of pages */
  totalPages: number
  /** Total number of items */
  total: number
  /** Items per page */
  limit: number
  /** Called when page changes */
  onPageChange: (page: number) => void
  /** Called when limit (items per page) changes */
  onLimitChange?: (limit: number) => void
  /** Available limit options */
  limitOptions?: number[]
  /** Whether data is currently loading */
  isLoading?: boolean
  /** Item label (e.g. "pegawai", "data") */
  itemLabel?: string
  /** Compact mode for mobile-friendly display */
  compact?: boolean
}

// ---------------------------------------------------------------------------
// Helper: compute visible page numbers
// ---------------------------------------------------------------------------

function getPageNumbers(current: number, total: number, maxVisible = 5): (number | 'ellipsis')[] {
  if (total <= maxVisible) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  const pages: (number | 'ellipsis')[] = []
  const half = Math.floor(maxVisible / 2)

  let start = Math.max(1, current - half)
  const end = Math.min(total, start + maxVisible - 1)

  // Adjust start if we're near the end
  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1)
  }

  // Always show first page
  if (start > 1) {
    pages.push(1)
    if (start > 2) pages.push('ellipsis')
  }

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  // Always show last page
  if (end < total) {
    if (end < total - 1) pages.push('ellipsis')
    pages.push(total)
  }

  return pages
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DataPagination({
  page,
  totalPages,
  total,
  limit,
  onPageChange,
  onLimitChange,
  limitOptions = [10, 20, 50, 100],
  isLoading = false,
  itemLabel = 'data',
  compact = false,
}: DataPaginationProps) {
  const pages = getPageNumbers(page, totalPages, compact ? 3 : 5)
  const startIndex = (page - 1) * limit + 1
  const endIndex = Math.min(page * limit, total)

  return (
    <div className={`flex flex-col sm:flex-row items-center gap-3 ${compact ? 'gap-2' : ''}`}>
      {/* Info */}
      <div className="flex items-center gap-3 text-xs sm:text-sm text-muted-foreground">
        <span>
          {total > 0 ? (
            <>
              {startIndex}–{endIndex} dari {total} {itemLabel}
            </>
          ) : (
            <>0 {itemLabel}</>
          )}
        </span>

        {/* Per-page selector */}
        {onLimitChange && (
          <>
            <span className="text-muted-foreground/40">|</span>
            <div className="flex items-center gap-1.5">
              <span>Tampilkan:</span>
              <Select
                value={String(limit)}
                onValueChange={(v) => onLimitChange(Number(v))}
              >
                <SelectTrigger className="h-7 w-[68px] text-xs border-blue-200 dark:border-blue-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {limitOptions.map((opt) => (
                    <SelectItem key={opt} value={String(opt)}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        )}
      </div>

      {/* Page navigation */}
      {totalPages > 1 && (
        <div className="flex items-center gap-1 ml-auto">
          {/* First page */}
          {!compact && (
            <Button
              variant="outline"
              size="icon"
              className="size-8 border-blue-200 dark:border-blue-800 text-[#2563eb] dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
              disabled={page <= 1 || isLoading}
              onClick={() => onPageChange(1)}
            >
              <ChevronsLeft className="size-3.5" />
            </Button>
          )}

          {/* Previous */}
          <Button
            variant="outline"
            size={compact ? 'icon' : 'sm'}
            className={`border-blue-200 dark:border-blue-800 text-[#2563eb] dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 ${compact ? 'size-8' : 'h-8'}`}
            disabled={page <= 1 || isLoading}
            onClick={() => onPageChange(page - 1)}
          >
            <ChevronLeft className="size-3.5" />
            {!compact && <span className="ml-1">Sebelumnya</span>}
          </Button>

          {/* Page numbers */}
          {pages.map((p, i) =>
            p === 'ellipsis' ? (
              <span key={`e${i}`} className="px-1 text-xs text-muted-foreground">
                ...
              </span>
            ) : (
              <Button
                key={p}
                variant={p === page ? 'default' : 'outline'}
                size="icon"
                className={`size-8 text-xs font-medium ${
                  p === page
                    ? 'bg-[#1e40af] hover:bg-[#1e3a8a] text-white shadow-sm'
                    : 'border-blue-200 dark:border-blue-800 text-[#2563eb] dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                }`}
                disabled={isLoading}
                onClick={() => onPageChange(p)}
              >
                {p}
              </Button>
            )
          )}

          {/* Next */}
          <Button
            variant="outline"
            size={compact ? 'icon' : 'sm'}
            className={`border-blue-200 dark:border-blue-800 text-[#2563eb] dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 ${compact ? 'size-8' : 'h-8'}`}
            disabled={page >= totalPages || isLoading}
            onClick={() => onPageChange(page + 1)}
          >
            {!compact && <span className="mr-1">Selanjutnya</span>}
            <ChevronRight className="size-3.5" />
          </Button>

          {/* Last page */}
          {!compact && (
            <Button
              variant="outline"
              size="icon"
              className="size-8 border-blue-200 dark:border-blue-800 text-[#2563eb] dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
              disabled={page >= totalPages || isLoading}
              onClick={() => onPageChange(totalPages)}
            >
              <ChevronsRight className="size-3.5" />
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
