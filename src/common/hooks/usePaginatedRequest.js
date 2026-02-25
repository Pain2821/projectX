import { useCallback, useEffect, useMemo, useState } from "react";

function extractThrottleSeconds(message) {
  const rawText = String(message || "").trim();
  let text = rawText;

  if (rawText.startsWith("{") && rawText.endsWith("}")) {
    try {
      const parsed = JSON.parse(rawText);
      if (typeof parsed?.detail === "string") {
        text = parsed.detail;
      } else if (typeof parsed?.message === "string") {
        text = parsed.message;
      }
    } catch (_error) {
      text = rawText;
    }
  }

  const match =
    text.match(/available in\s+(\d+)\s+seconds?/i) ||
    text.match(/retry(?:ing)? in\s+(\d+)\s+seconds?/i) ||
    text.match(/(\d+)\s+seconds?/i);
  const seconds = match ? Number(match[1]) : 0;

  if (!Number.isFinite(seconds) || seconds <= 0) {
    return 0;
  }

  return Math.floor(seconds);
}

function sanitizeThrottleMessage(message) {
  return String(message || "").replace(/\s*\(status\s*\d+\)\s*$/i, "").trim();
}

export function usePaginatedRequest({ itemsPerPage, fetchPage }) {
  const [items, setItems] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [navigating, setNavigating] = useState(false);
  const [error, setError] = useState("");
  const [retryTick, setRetryTick] = useState(0);
  const [retryAvailableAt, setRetryAvailableAt] = useState(0);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const controller = new AbortController();
    const isFirstPage = currentPage === 1;

    if (isFirstPage) {
      setLoading(true);
    } else {
      setNavigating(true);
    }

    async function loadPage() {
      try {
        const offset = (currentPage - 1) * itemsPerPage;
        const data = await fetchPage({
          limit: itemsPerPage,
          offset,
          signal: controller.signal,
        });

        setItems(Array.isArray(data?.results) ? data.results : []);
        setTotalCount(Number.isFinite(data?.count) ? data.count : 0);
        setError("");
        setRetryAvailableAt(0);
      } catch (requestError) {
        if (controller.signal.aborted) {
          return;
        }

        const message = sanitizeThrottleMessage(requestError?.message || "Unable to load data.");
        const throttleSeconds = extractThrottleSeconds(message);

        setError(message);
        setRetryAvailableAt(throttleSeconds > 0 ? Date.now() + throttleSeconds * 1000 : 0);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
          setNavigating(false);
        }
      }
    }

    loadPage();

    return () => {
      controller.abort();
    };
  }, [currentPage, retryTick, itemsPerPage, fetchPage]);

  useEffect(() => {
    if (!retryAvailableAt) {
      return undefined;
    }

    const intervalId = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(intervalId);
  }, [retryAvailableAt]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalCount / itemsPerPage)),
    [totalCount, itemsPerPage]
  );
  const startIndex = totalCount > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
  const endIndex = Math.min(currentPage * itemsPerPage, totalCount);
  const canGoPrevious = currentPage > 1 && !navigating;
  const canGoNext = currentPage < totalPages && !navigating;
  const cooldownSeconds = retryAvailableAt ? Math.max(0, Math.ceil((retryAvailableAt - now) / 1000)) : 0;
  const canRetry = cooldownSeconds <= 0 && !loading && !navigating;
  const displayError =
    cooldownSeconds > 0
      ? `Request was throttled. Expected available in ${cooldownSeconds} seconds.`
      : error;

  const goPrevious = useCallback(() => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  }, []);

  const goNext = useCallback(() => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  }, [totalPages]);

  const retry = useCallback(() => {
    if (!canRetry) {
      return;
    }
    setError("");
    setRetryTick((prev) => prev + 1);
  }, [canRetry]);

  return {
    items,
    setItems,
    currentPage,
    setCurrentPage,
    totalCount,
    totalPages,
    startIndex,
    endIndex,
    loading,
    navigating,
    error,
    displayError,
    retry,
    canRetry,
    cooldownSeconds,
    goPrevious,
    goNext,
    canGoPrevious,
    canGoNext,
  };
}

export default usePaginatedRequest;
