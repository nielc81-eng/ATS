import React from "react";

export default function Pagination({
  page,
  totalPages,
  pageSize,
  totalItems,
  onPrev,
  onNext,
  onPageChange,
  pageSizeOptions,
  onPageSizeChange,
  label = "Items",
}) {
  const safePage = Number.isFinite(Number(page)) ? Number(page) : 1;
  const safeTotalPages = Number.isFinite(Number(totalPages)) ? Number(totalPages) : 1;
  const safePageSize = Number.isFinite(Number(pageSize)) ? Number(pageSize) : 10;
  const safeTotalItems = Number.isFinite(Number(totalItems)) ? Number(totalItems) : 0;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-6 py-4">
      <div className="flex flex-wrap items-center gap-4">
        <p className="text-xs text-slate-500" aria-label={`${label} pagination status`}>
          Page {safePage} of {safeTotalPages} · {safeTotalItems} total
        </p>

        {Array.isArray(pageSizeOptions) && pageSizeOptions.length > 0 && onPageSizeChange ? (
          <label className="flex items-center gap-2 text-xs text-slate-500">
            <span className="font-medium uppercase tracking-[0.14em] text-slate-400">Page size</span>
            <select
              value={safePageSize}
              onChange={(event) => onPageSizeChange(Number(event.target.value))}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onPrev}
          disabled={safePage <= 1}
          className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Previous
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={safePage >= safeTotalPages}
          className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
