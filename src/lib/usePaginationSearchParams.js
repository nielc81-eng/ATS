import { useCallback, useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { clampInt, coercePositiveInt } from "./pagination";

function normalizeDefaults(input = {}) {
  const defaultPageSize = coercePositiveInt(input.defaultPageSize, 10);
  const maxPageSize = coercePositiveInt(input.maxPageSize, 100);
  return { defaultPageSize, maxPageSize: Math.max(defaultPageSize, maxPageSize) };
}

function readParam(searchParams, key) {
  if (!searchParams || typeof searchParams.get !== "function") return "";
  return String(searchParams.get(key) || "").trim();
}

function applyPaginationParams(params, { page, pageSize, defaultPageSize }) {
  const safePage = coercePositiveInt(page, 1);
  const safePageSize = coercePositiveInt(pageSize, defaultPageSize);

  if (safePage <= 1) params.delete("page");
  else params.set("page", String(safePage));

  if (safePageSize === defaultPageSize) params.delete("pageSize");
  else params.set("pageSize", String(safePageSize));

  return params;
}

export function usePaginationSearchParams(input) {
  const { defaultPageSize, maxPageSize } = useMemo(() => normalizeDefaults(input), [input]);

  const [searchParams, setSearchParams] = useSearchParams();

  // Keep a stable reference to avoid effect loops (React Router returns a new
  // searchParams object every render).
  const searchParamsRef = useRef(searchParams);
  searchParamsRef.current = searchParams;

  const rawPage = readParam(searchParams, "page");
  const rawPageSize = readParam(searchParams, "pageSize");

  const page = useMemo(() => coercePositiveInt(rawPage, 1), [rawPage]);
  const pageSize = useMemo(() => {
    const coerced = coercePositiveInt(rawPageSize, defaultPageSize);
    return clampInt(coerced, 1, maxPageSize);
  }, [defaultPageSize, maxPageSize, rawPageSize]);

  const writePagination = useCallback(
    (next) => {
      const current = new URLSearchParams(searchParamsRef.current);
      applyPaginationParams(current, {
        page: next.page,
        pageSize: next.pageSize,
        defaultPageSize,
      });
      setSearchParams(current, { replace: true });
    },
    [defaultPageSize, setSearchParams]
  );

  const resetPage = useCallback(() => {
    writePagination({ page: 1, pageSize });
  }, [pageSize, writePagination]);

  const setPage = useCallback(
    (nextPage) => {
      writePagination({ page: nextPage, pageSize });
    },
    [pageSize, writePagination]
  );

  const setPageSize = useCallback(
    (nextPageSize) => {
      const safeNext = clampInt(coercePositiveInt(nextPageSize, defaultPageSize), 1, maxPageSize);
      writePagination({ page: 1, pageSize: safeNext });
    },
    [defaultPageSize, maxPageSize, writePagination]
  );

  useEffect(() => {
    const current = new URLSearchParams(searchParamsRef.current);

    const normalizedPage = coercePositiveInt(readParam(current, "page"), 1);
    const normalizedPageSize = clampInt(
      coercePositiveInt(readParam(current, "pageSize"), defaultPageSize),
      1,
      maxPageSize
    );

    const next = new URLSearchParams(current);
    applyPaginationParams(next, {
      page: normalizedPage,
      pageSize: normalizedPageSize,
      defaultPageSize,
    });

    if (next.toString() !== current.toString()) {
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultPageSize, maxPageSize, setSearchParams]);

  return {
    page,
    pageSize,
    setPage,
    setPageSize,
    resetPage,
  };
}
