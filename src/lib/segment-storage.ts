import { SavedSegment, SegmentFilters, DEFAULT_FILTERS } from "./segment-types";

const STORAGE_KEY = "solana-scanner-segments";

/** Migrate old saved segments to current filter schema */
function migrateFilters(seg: SavedSegment): SavedSegment {
  const f = seg.filters ?? {} as Record<string, unknown>;

  // launchpad: was string "any" or undefined, now string[]
  if (!Array.isArray(f.launchpad)) {
    const old = f.launchpad as unknown as string | undefined;
    f.launchpad = old && old !== "any" ? [old] : [];
  }

  // amm: was string "any" or undefined, now string[]
  if (!Array.isArray(f.amm)) {
    const old = f.amm as unknown as string | undefined;
    f.amm = old && old !== "any" ? [old] : [];
  }

  // lastTweet: added later, default to "any" if missing
  if (!f.lastTweet) {
    f.lastTweet = "any";
  }

  // Merge with defaults — strip undefined values from f so defaults actually apply
  const cleaned = Object.fromEntries(
    Object.entries(f).filter(([, v]) => v !== undefined)
  );
  seg.filters = { ...DEFAULT_FILTERS, ...cleaned } as SegmentFilters;

  return seg;
}

export function loadSegments(): SavedSegment[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(migrateFilters);
  } catch {
    return [];
  }
}

export function saveSegments(segments: SavedSegment[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(segments));
  } catch {
    // localStorage quota exceeded — silently fail
  }
}

export function addSegment(segment: SavedSegment): SavedSegment[] {
  const segments = loadSegments();
  segments.unshift(segment);
  saveSegments(segments);
  return segments;
}

export function deleteSegment(id: string): SavedSegment[] {
  const segments = loadSegments().filter((s) => s.id !== id);
  saveSegments(segments);
  return segments;
}

export function updateSegmentLastRun(
  id: string,
  resultCount: number
): SavedSegment[] {
  const segments = loadSegments().map((s) =>
    s.id === id
      ? { ...s, lastRunAt: Date.now(), lastResultCount: resultCount }
      : s
  );
  saveSegments(segments);
  return segments;
}
