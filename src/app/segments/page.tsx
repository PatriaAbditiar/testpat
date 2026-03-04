"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { SegmentForm } from "@/components/segments/SegmentForm";
import { SegmentSidebar } from "@/components/segments/SegmentSidebar";
import { SegmentResults } from "@/components/segments/SegmentResults";
import {
  SegmentFilters,
  SegmentTokenResult,
  SavedSegment,
  DEFAULT_FILTERS,
} from "@/lib/segment-types";
import { fetchSegmentTokens } from "@/lib/segment-query";
import {
  loadSegments,
  addSegment,
  deleteSegment as deleteSegmentFromStorage,
  updateSegmentLastRun,
} from "@/lib/segment-storage";

export default function SegmentsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center text-green-600 font-mono">
          Loading…
        </div>
      }
    >
      <SegmentsContent />
    </Suspense>
  );
}

function SegmentsContent() {
  // Filter state
  const [filters, setFilters] = useState<SegmentFilters>({ ...DEFAULT_FILTERS });
  const [segmentName, setSegmentName] = useState("");

  // Results state
  const [results, setResults] = useState<SegmentTokenResult[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasRun, setHasRun] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Auto-refresh
  const [autoRefresh, setAutoRefresh] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Saved segments
  const [savedSegments, setSavedSegments] = useState<SavedSegment[]>([]);
  const [activeSegmentId, setActiveSegmentId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const searchParams = useSearchParams();
  const initialLoadDone = useRef(false);

  // Load saved segments on mount + auto-load from ?id= param
  useEffect(() => {
    const segments = loadSegments();
    setSavedSegments(segments);

    // If ?id= is in the URL, auto-load that segment
    if (!initialLoadDone.current) {
      initialLoadDone.current = true;
      const idParam = searchParams.get("id");
      if (idParam) {
        const match = segments.find((s) => s.id === idParam);
        if (match) {
          setFilters({ ...match.filters });
          setActiveSegmentId(match.id);
          setSegmentName(match.name);
          // Auto-run — inline fetch to avoid stale closure
          setLoading(true);
          fetchSegmentTokens(match.filters)
            .then(({ results: data, totalCount: count }) => {
              setResults(data);
              setTotalCount(count);
              setCurrentPage(0);
              setHasRun(true);
              setLastUpdate(new Date());
              const updated = updateSegmentLastRun(match.id, count);
              setSavedSegments(updated);
            })
            .catch((err) => {
              setError(err instanceof Error ? err.message : "Unknown error");
            })
            .finally(() => setLoading(false));
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Run segment query — fetches ALL results, pagination is client-side
  const runSegment = useCallback(
    async () => {
      setLoading(true);
      setError(null);
      try {
        const { results: data, totalCount: count } =
          await fetchSegmentTokens(filters);
        setResults(data);
        setTotalCount(count);
        setCurrentPage(0);
        setHasRun(true);
        setLastUpdate(new Date());

        // Update saved segment count if active
        if (activeSegmentId) {
          const updated = updateSegmentLastRun(activeSegmentId, count);
          setSavedSegments(updated);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    },
    [filters, activeSegmentId]
  );

  // Auto-refresh every 5 minutes
  useEffect(() => {
    if (autoRefresh && hasRun) {
      intervalRef.current = setInterval(() => runSegment(), 300_000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoRefresh, hasRun, runSegment]);

  // Handle page change — purely client-side now
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Save segment
  const handleSave = () => {
    if (!segmentName.trim()) return;
    const segment: SavedSegment = {
      id: crypto.randomUUID(),
      name: segmentName.trim(),
      filters: { ...filters },
      createdAt: Date.now(),
      lastRunAt: null,
      lastResultCount: null,
    };
    const updated = addSegment(segment);
    setSavedSegments(updated);
    setActiveSegmentId(segment.id);
    setSegmentName("");
  };

  // Load saved segment — set state + immediately run
  const handleSelectSegment = (segment: SavedSegment) => {
    setFilters({ ...segment.filters });
    setActiveSegmentId(segment.id);
    setSegmentName(segment.name);
    setSidebarOpen(false);
    runSegmentDirect(segment.filters, segment.id);
  };

  // Direct run with explicit filters (avoids stale closure)
  const runSegmentDirect = async (
    f: SegmentFilters,
    segId: string | null
  ) => {
    setLoading(true);
    setError(null);
    try {
      const { results: data, totalCount: count } =
        await fetchSegmentTokens(f);
      setResults(data);
      setTotalCount(count);
      setCurrentPage(0);
      setHasRun(true);
      setLastUpdate(new Date());
      if (segId) {
        const updated = updateSegmentLastRun(segId, count);
        setSavedSegments(updated);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  // Delete segment
  const handleDeleteSegment = (id: string) => {
    const updated = deleteSegmentFromStorage(id);
    setSavedSegments(updated);
    if (activeSegmentId === id) setActiveSegmentId(null);
  };

  // Reset filters
  const handleReset = () => {
    setFilters({ ...DEFAULT_FILTERS });
    setSegmentName("");
    setActiveSegmentId(null);
    setResults([]);
    setTotalCount(0);
    setHasRun(false);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-gray-100 font-mono">
      {/* Header */}
      <header className="border-b border-green-900/40 bg-[#0d0d14] px-6 py-4">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-gray-500 hover:text-green-400 transition-colors text-sm"
            >
              ← Scanner
            </Link>
            <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
              </span>
              <h1 className="text-xl font-bold tracking-tight text-green-400">
                Segment Builder
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-500">
            {lastUpdate && (
              <span>Last run: {lastUpdate.toLocaleTimeString()}</span>
            )}
            <Badge
              variant="outline"
              className="border-green-800 text-green-500 text-xs"
            >
              CODEX API
            </Badge>
          </div>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto px-6 py-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar */}
          <SegmentSidebar
            segments={savedSegments}
            activeSegmentId={activeSegmentId}
            onSelect={handleSelectSegment}
            onDelete={handleDeleteSegment}
            open={sidebarOpen}
            onToggle={() => setSidebarOpen(!sidebarOpen)}
          />

          {/* Main content */}
          <div className="flex-1 min-w-0 space-y-6">
            {/* Form */}
            <SegmentForm
              filters={filters}
              segmentName={segmentName}
              loading={loading}
              onFiltersChange={(f) => {
                setFilters(f);
                setActiveSegmentId(null);
              }}
              onSegmentNameChange={setSegmentName}
              onRun={() => runSegment()}
              onSave={handleSave}
              onReset={handleReset}
            />

            {/* Results */}
            <SegmentResults
              results={results}
              totalCount={totalCount}
              currentPage={currentPage}
              loading={loading}
              error={error}
              hasRun={hasRun}
              autoRefresh={autoRefresh}
              onPageChange={handlePageChange}
              onToggleAutoRefresh={() => setAutoRefresh(!autoRefresh)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
