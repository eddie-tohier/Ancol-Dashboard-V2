"use client"

interface FloatingFilterBadgeProps {
  activeFilterCount: number
  onClearAll: () => void
}

export default function FloatingFilterBadge({ activeFilterCount, onClearAll }: FloatingFilterBadgeProps) {
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-orange-600 pl-3 pr-1 py-1.5 shadow-lg transition-all duration-300 ${
      activeFilterCount > 0 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
    }`}>
      <span className="inline-flex items-center gap-1 text-xs font-bold text-white">
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-bold text-orange-600">
          {activeFilterCount}
        </span>
        {activeFilterCount === 1 ? "Filter Active" : "Filters Active"}
      </span>
      <button
        type="button"
        onClick={onClearAll}
        className="rounded-full bg-white/20 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/30"
      >
        Clear All
      </button>
    </div>
  )
}
