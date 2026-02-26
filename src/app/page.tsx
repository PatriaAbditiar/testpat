"use client";

import { type JSX, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchFilteredTokens, TokenResult } from "@/lib/codex";
import { loadSegments, addSegment } from "@/lib/segment-storage";
import {
  SavedSegment,
  SegmentFilters,
  DEFAULT_FILTERS,
  NetworkKey,
  NETWORK_LABELS,
  TOKEN_AGE_OPTIONS,
  LAST_TXN_OPTIONS,
  LAUNCHPAD_OPTIONS,
  AMM_OPTIONS,
  TokenAgePreset,
  LastTxnPreset,
} from "@/lib/segment-types";

type TimeWindow = { label: string; seconds: number };
type McapFilter = { label: string; value: number | null };

const TIME_WINDOWS: TimeWindow[] = [
  { label: "1h", seconds: 3600 },
  { label: "6h", seconds: 21600 },
  { label: "12h", seconds: 43200 },
  { label: "24h", seconds: 86400 },
];

const MCAP_FILTERS: McapFilter[] = [
  { label: "Any", value: null },
  { label: "100K", value: 100_000 },
  { label: "300K", value: 300_000 },
  { label: "500K", value: 500_000 },
  { label: "1M", value: 1_000_000 },
];

function formatNumber(value: string | null | undefined): string {
  if (!value) return "—";
  const num = parseFloat(value);
  if (isNaN(num)) return "—";
  if (num >= 1_000_000_000) return `$${(num / 1_000_000_000).toFixed(2)}B`;
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(2)}M`;
  if (num >= 1_000) return `$${(num / 1_000).toFixed(2)}K`;
  if (num >= 1) return `$${num.toFixed(2)}`;
  return `$${num.toPrecision(4)}`;
}

function formatPrice(value: string | null | undefined): string {
  if (!value) return "—";
  const num = parseFloat(value);
  if (isNaN(num)) return "—";
  if (num >= 1) return `$${num.toFixed(4)}`;
  if (num >= 0.0001) return `$${num.toFixed(6)}`;
  return `$${num.toPrecision(4)}`;
}

function formatChange(value: string | null | undefined): string {
  if (!value) return "—";
  const num = parseFloat(value);
  if (isNaN(num)) return "—";
  return `${num >= 0 ? "+" : ""}${num.toFixed(2)}%`;
}

function SocialIcon({ type, url }: { type: string; url: string }) {
  const icons: Record<string, JSX.Element> = {
    twitter: (
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
    telegram: (
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
      </svg>
    ),
    discord: (
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
        <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z" />
      </svg>
    ),
    website: (
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
    email: (
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
      </svg>
    ),
  };

  const href = type === "email" ? `mailto:${url}` : url;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="text-gray-500 hover:text-green-400 transition-colors"
      title={type.charAt(0).toUpperCase() + type.slice(1)}
    >
      {icons[type] ?? null}
    </a>
  );
}

function timeAgo(unixTimestamp: number): string {
  const seconds = Math.floor(Date.now() / 1000 - unixTimestamp);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ${minutes % 60}m ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h ago`;
}

export default function Dashboard() {
  const [timeWindow, setTimeWindow] = useState(TIME_WINDOWS[3]);
  const [mcapFilter, setMcapFilter] = useState(MCAP_FILTERS[0]);
  const [tokens, setTokens] = useState<TokenResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [minLiquidity, setMinLiquidity] = useState("1000");
  const [autoRefresh, setAutoRefresh] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [savedSegments, setSavedSegments] = useState<SavedSegment[]>([]);
  const [mainPage, setMainPage] = useState(0);
  const MAIN_PAGE_SIZE = 100;

  // Create Filter panel state
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [segFilters, setSegFilters] = useState<SegmentFilters>({ ...DEFAULT_FILTERS });
  const [newSegmentName, setNewSegmentName] = useState("");

  const updateSegFilter = (partial: Partial<SegmentFilters>) => {
    setSegFilters((prev) => ({ ...prev, ...partial }));
  };

  // Defensive: ensure arrays even if old data sneaks through
  const segLaunchpad = Array.isArray(segFilters.launchpad) ? segFilters.launchpad : [];
  const segAmm = Array.isArray(segFilters.amm) ? segFilters.amm : [];

  const numericOnly = (val: string) => val.replace(/[^0-9.-]/g, "");

  const toggleArrayValue = (arr: string[], value: string): string[] =>
    arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];

  const handleSaveSegment = () => {
    if (!newSegmentName.trim()) return;
    const segment: SavedSegment = {
      id: crypto.randomUUID(),
      name: newSegmentName.trim(),
      filters: { ...segFilters },
      createdAt: Date.now(),
      lastRunAt: null,
      lastResultCount: null,
    };
    addSegment(segment);
    // Navigate to the segment builder with the new segment auto-loaded
    window.location.href = `/segments?id=${segment.id}`;
  };

  const NETWORKS: NetworkKey[] = ["all", "solana", "ethereum", "base"];

  // Load saved segments on mount
  useEffect(() => {
    setSavedSegments(loadSegments());
  }, []);

  const scan = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const liq = parseFloat(minLiquidity) || 0;
      const results = await fetchFilteredTokens(
        timeWindow.seconds,
        mcapFilter.value,
        liq
      );
      setTokens(results);
      setMainPage(0);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [timeWindow, mcapFilter, minLiquidity]);

  useEffect(() => {
    if (autoRefresh) {
      scan();
      intervalRef.current = setInterval(scan, 60_000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoRefresh, scan]);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-gray-100 font-mono">
      {/* Header */}
      <header className="border-b border-green-900/40 bg-[#0d0d14] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
            </span>
            <h1 className="text-xl font-bold tracking-tight text-green-400">
              Solana Token Scanner
            </h1>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <Link
              href="/segments"
              className="text-gray-400 hover:text-green-400 transition-colors font-medium"
            >
              Segment Builder →
            </Link>
            {lastUpdate && (
              <span>Last scan: {lastUpdate.toLocaleTimeString()}</span>
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

      <main className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Saved Segments Quick Select */}
        {savedSegments.length > 0 && (
          <div className="bg-[#0d0d14] border border-green-900/30 rounded-lg p-4">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs text-gray-500 uppercase tracking-wider shrink-0">
                Segments
              </span>
              {savedSegments.map((seg) => (
                <Link
                  key={seg.id}
                  href={`/segments?id=${seg.id}`}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-green-900/50 text-sm text-gray-400 hover:text-green-400 hover:border-green-700 hover:bg-green-950/30 transition-colors"
                >
                  <span>{seg.name}</span>
                  {seg.lastResultCount != null && (
                    <span className="text-[10px] bg-green-900/40 text-green-500 px-1.5 py-0.5 rounded-full">
                      {seg.lastResultCount}
                    </span>
                  )}
                </Link>
              ))}
              <Link
                href="/segments"
                className="text-xs text-gray-600 hover:text-green-400 transition-colors ml-1"
              >
                + New
              </Link>
            </div>
          </div>
        )}

        {/* Create Filter Panel */}
        <div className="bg-[#0d0d14] border border-green-900/30 rounded-lg overflow-hidden">
          <button
            onClick={() => setFilterPanelOpen(!filterPanelOpen)}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-green-950/20 transition-colors"
          >
            <div className="flex items-center gap-2">
              <svg
                className={`w-4 h-4 text-green-400 transition-transform ${filterPanelOpen ? "rotate-90" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="m9 5 7 7-7 7" />
              </svg>
              <span className="text-sm font-bold text-green-400 uppercase tracking-wider">
                Create Filter / Segment
              </span>
            </div>
            <span className="text-xs text-gray-600">
              {filterPanelOpen ? "Collapse" : "Expand"}
            </span>
          </button>

          {filterPanelOpen && (
            <div className="px-5 pb-5 pt-2 border-t border-green-900/30 space-y-5">
              {/* Network */}
              <div className="space-y-2">
                <label className="text-xs text-gray-500 uppercase tracking-wider">
                  Network
                </label>
                <div className="flex gap-1 flex-wrap">
                  {NETWORKS.map((net) => (
                    <Button
                      key={net}
                      size="sm"
                      variant={segFilters.network === net ? "default" : "outline"}
                      className={
                        segFilters.network === net
                          ? "bg-green-600 hover:bg-green-700 text-white border-green-600"
                          : "border-green-900/50 text-gray-400 hover:text-green-400 hover:border-green-700"
                      }
                      onClick={() => updateSegFilter({ network: net })}
                    >
                      {NETWORK_LABELS[net]}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Token Age + Last Transaction */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs text-gray-500 uppercase tracking-wider">
                    Token Age
                  </label>
                  <Select
                    value={segFilters.tokenAge}
                    onValueChange={(v) => updateSegFilter({ tokenAge: v as TokenAgePreset })}
                  >
                    <SelectTrigger className="border-green-900/50 bg-transparent text-gray-200 focus:ring-green-600">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0d0d14] border-green-900/50">
                      {TOKEN_AGE_OPTIONS.map((opt) => (
                        <SelectItem
                          key={opt.value}
                          value={opt.value}
                          className="text-gray-200 focus:bg-green-950 focus:text-green-400"
                        >
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-gray-500 uppercase tracking-wider">
                    Last Transaction
                  </label>
                  <Select
                    value={segFilters.lastTransaction}
                    onValueChange={(v) => updateSegFilter({ lastTransaction: v as LastTxnPreset })}
                  >
                    <SelectTrigger className="border-green-900/50 bg-transparent text-gray-200 focus:ring-green-600">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0d0d14] border-green-900/50">
                      {LAST_TXN_OPTIONS.map((opt) => (
                        <SelectItem
                          key={opt.value}
                          value={opt.value}
                          className="text-gray-200 focus:bg-green-950 focus:text-green-400"
                        >
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Launchpad (multi-select) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-gray-500 uppercase tracking-wider">
                    Launchpad
                  </label>
                  {segLaunchpad.length > 0 && (
                    <button
                      type="button"
                      onClick={() => updateSegFilter({ launchpad: [] })}
                      className="text-[10px] text-gray-600 hover:text-green-400 transition-colors"
                    >
                      Clear ({segLaunchpad.length})
                    </button>
                  )}
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {LAUNCHPAD_OPTIONS.map((opt) => {
                    const active = segLaunchpad.includes(opt.value);
                    return (
                      <Button
                        key={opt.value}
                        type="button"
                        size="sm"
                        variant={active ? "default" : "outline"}
                        className={
                          active
                            ? "bg-green-600 hover:bg-green-700 text-white border-green-600 h-7 text-xs"
                            : "border-green-900/50 text-gray-400 hover:text-green-400 hover:border-green-700 h-7 text-xs"
                        }
                        onClick={() =>
                          updateSegFilter({ launchpad: toggleArrayValue(segLaunchpad, opt.value) })
                        }
                      >
                        {opt.label}
                      </Button>
                    );
                  })}
                </div>
                {segLaunchpad.length === 0 && (
                  <p className="text-[10px] text-gray-600">None selected = all launchpads</p>
                )}
              </div>

              {/* AMM / DEX (multi-select) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-gray-500 uppercase tracking-wider">
                    AMM / DEX
                  </label>
                  {segAmm.length > 0 && (
                    <button
                      type="button"
                      onClick={() => updateSegFilter({ amm: [] })}
                      className="text-[10px] text-gray-600 hover:text-green-400 transition-colors"
                    >
                      Clear ({segAmm.length})
                    </button>
                  )}
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {AMM_OPTIONS.map((opt) => {
                    const active = segAmm.includes(opt.value);
                    return (
                      <Button
                        key={opt.value}
                        type="button"
                        size="sm"
                        variant={active ? "default" : "outline"}
                        className={
                          active
                            ? "bg-green-600 hover:bg-green-700 text-white border-green-600 h-7 text-xs"
                            : "border-green-900/50 text-gray-400 hover:text-green-400 hover:border-green-700 h-7 text-xs"
                        }
                        onClick={() =>
                          updateSegFilter({ amm: toggleArrayValue(segAmm, opt.value) })
                        }
                      >
                        {opt.label}
                      </Button>
                    );
                  })}
                </div>
                {segAmm.length === 0 && (
                  <p className="text-[10px] text-gray-600">None selected = all DEXes</p>
                )}
              </div>

              {/* Price Change Min/Max */}
              <div className="space-y-2">
                <label className="text-xs text-gray-500 uppercase tracking-wider">
                  Price Change 24h (%)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    type="text"
                    inputMode="numeric"
                    placeholder="Min %"
                    value={segFilters.priceChangeMin}
                    onChange={(e) => updateSegFilter({ priceChangeMin: numericOnly(e.target.value) })}
                    className="border-green-900/50 bg-transparent text-gray-200 placeholder:text-gray-600 focus-visible:ring-green-600"
                  />
                  <Input
                    type="text"
                    inputMode="numeric"
                    placeholder="Max %"
                    value={segFilters.priceChangeMax}
                    onChange={(e) => updateSegFilter({ priceChangeMax: numericOnly(e.target.value) })}
                    className="border-green-900/50 bg-transparent text-gray-200 placeholder:text-gray-600 focus-visible:ring-green-600"
                  />
                </div>
              </div>

              {/* Volume, Liquidity, MarketCap */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-xs text-gray-500 uppercase tracking-wider">
                    Min Volume 24h ($)
                  </label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    placeholder="e.g. 10000"
                    value={segFilters.volume24Min}
                    onChange={(e) => updateSegFilter({ volume24Min: numericOnly(e.target.value) })}
                    className="border-green-900/50 bg-transparent text-gray-200 placeholder:text-gray-600 focus-visible:ring-green-600"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-gray-500 uppercase tracking-wider">
                    Min Liquidity ($)
                  </label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    placeholder="e.g. 1000"
                    value={segFilters.liquidityMin}
                    onChange={(e) => updateSegFilter({ liquidityMin: numericOnly(e.target.value) })}
                    className="border-green-900/50 bg-transparent text-gray-200 placeholder:text-gray-600 focus-visible:ring-green-600"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-gray-500 uppercase tracking-wider">
                    Min Market Cap ($)
                  </label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    placeholder="e.g. 100000"
                    value={segFilters.marketCapMin}
                    onChange={(e) => updateSegFilter({ marketCapMin: numericOnly(e.target.value) })}
                    className="border-green-900/50 bg-transparent text-gray-200 placeholder:text-gray-600 focus-visible:ring-green-600"
                  />
                </div>
              </div>

              {/* Holders + Checkbox */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                <div className="space-y-2">
                  <label className="text-xs text-gray-500 uppercase tracking-wider">
                    Min Holders
                  </label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    placeholder="e.g. 100"
                    value={segFilters.holdersMin}
                    onChange={(e) => updateSegFilter({ holdersMin: numericOnly(e.target.value) })}
                    className="border-green-900/50 bg-transparent text-gray-200 placeholder:text-gray-600 focus-visible:ring-green-600"
                  />
                </div>
                <div className="flex items-center gap-2 h-9">
                  <Checkbox
                    id="mainMoreSells"
                    checked={segFilters.moreSellsThanBuys}
                    onCheckedChange={(checked) => updateSegFilter({ moreSellsThanBuys: checked === true })}
                    className="border-green-900/50 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                  />
                  <label
                    htmlFor="mainMoreSells"
                    className="text-sm text-gray-400 cursor-pointer select-none"
                  >
                    More sells than buys (24h)
                  </label>
                </div>
              </div>

              {/* Save segment actions */}
              <div className="border-t border-green-900/30 pt-4">
                <div className="flex gap-3 items-end flex-wrap">
                  <div className="flex-1 min-w-[200px] space-y-2">
                    <label className="text-xs text-gray-500 uppercase tracking-wider">
                      Segment Name
                    </label>
                    <Input
                      type="text"
                      placeholder="My Segment"
                      value={newSegmentName}
                      onChange={(e) => setNewSegmentName(e.target.value)}
                      className="border-green-900/50 bg-transparent text-gray-200 placeholder:text-gray-600 focus-visible:ring-green-600"
                    />
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-green-900/50 text-gray-400 hover:text-green-400 hover:border-green-700"
                    onClick={() => {
                      setSegFilters({ ...DEFAULT_FILTERS });
                      setNewSegmentName("");
                    }}
                  >
                    Reset
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveSegment}
                    disabled={!newSegmentName.trim()}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold px-6"
                  >
                    Save & Open in Segment Builder
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-end gap-6 bg-[#0d0d14] border border-green-900/30 rounded-lg p-4">
          {/* Time Window */}
          <div className="space-y-2">
            <label className="text-xs text-gray-500 uppercase tracking-wider">
              Time Window
            </label>
            <div className="flex gap-1">
              {TIME_WINDOWS.map((tw) => (
                <Button
                  key={tw.label}
                  size="sm"
                  variant={
                    timeWindow.label === tw.label ? "default" : "outline"
                  }
                  className={
                    timeWindow.label === tw.label
                      ? "bg-green-600 hover:bg-green-700 text-white border-green-600"
                      : "border-green-900/50 text-gray-400 hover:text-green-400 hover:border-green-700"
                  }
                  onClick={() => setTimeWindow(tw)}
                >
                  {tw.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Min Market Cap */}
          <div className="space-y-2">
            <label className="text-xs text-gray-500 uppercase tracking-wider">
              Min Market Cap
            </label>
            <div className="flex gap-1">
              {MCAP_FILTERS.map((mc) => (
                <Button
                  key={mc.label}
                  size="sm"
                  variant={
                    mcapFilter.label === mc.label ? "default" : "outline"
                  }
                  className={
                    mcapFilter.label === mc.label
                      ? "bg-green-600 hover:bg-green-700 text-white border-green-600"
                      : "border-green-900/50 text-gray-400 hover:text-green-400 hover:border-green-700"
                  }
                  onClick={() => setMcapFilter(mc)}
                >
                  {mc.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Min Liquidity */}
          <div className="space-y-2">
            <label className="text-xs text-gray-500 uppercase tracking-wider">
              Min Liquidity ($)
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={minLiquidity}
              onChange={(e) => setMinLiquidity(e.target.value.replace(/[^0-9.]/g, ""))}
              placeholder="1000"
              className="h-9 w-28 rounded-md border border-green-900/50 bg-transparent px-3 text-sm text-gray-200 placeholder:text-gray-600 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 ml-auto">
            <Button
              onClick={() => setAutoRefresh(!autoRefresh)}
              size="sm"
              variant="outline"
              className={
                autoRefresh
                  ? "border-green-500 text-green-400 bg-green-950/50 hover:bg-green-950"
                  : "border-green-900/50 text-gray-400 hover:text-green-400 hover:border-green-700"
              }
            >
              {autoRefresh ? "⏸ Auto" : "▶ Auto"}
            </Button>
            <Button
              onClick={scan}
              disabled={loading}
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white font-bold px-6"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Scanning…
                </span>
              ) : (
                "Scan"
              )}
            </Button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-950/50 border border-red-800 rounded-lg p-4 text-red-400 text-sm">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Results */}
        {(() => {
          const totalPages = Math.max(1, Math.ceil(tokens.length / MAIN_PAGE_SIZE));
          const pagedTokens = tokens.slice(
            mainPage * MAIN_PAGE_SIZE,
            (mainPage + 1) * MAIN_PAGE_SIZE
          );
          return (
            <div className="border border-green-900/30 rounded-lg overflow-hidden bg-[#0d0d14]">
              <div className="px-4 py-3 border-b border-green-900/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 uppercase tracking-wider">
                    Results
                  </span>
                  <span className="text-xs text-gray-600">
                    {tokens.length} tokens
                    {tokens.length > MAIN_PAGE_SIZE &&
                      ` · showing ${mainPage * MAIN_PAGE_SIZE + 1}–${Math.min(
                        (mainPage + 1) * MAIN_PAGE_SIZE,
                        tokens.length
                      )}`}
                  </span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-green-900/30 hover:bg-transparent">
                      <TableHead className="text-green-600 text-xs uppercase">
                        Token
                      </TableHead>
                      <TableHead className="text-green-600 text-xs uppercase text-right">
                        Mcap
                      </TableHead>
                      <TableHead className="text-green-600 text-xs uppercase text-right">
                        Liquidity
                      </TableHead>
                      <TableHead className="text-green-600 text-xs uppercase text-right">
                        Price
                      </TableHead>
                      <TableHead className="text-green-600 text-xs uppercase text-right">
                        24h Vol
                      </TableHead>
                      <TableHead className="text-green-600 text-xs uppercase text-right">
                        24h Change
                      </TableHead>
                      <TableHead className="text-green-600 text-xs uppercase text-right">
                        Txns (24h)
                      </TableHead>
                      <TableHead className="text-green-600 text-xs uppercase text-right">
                        Launched
                      </TableHead>
                      <TableHead className="text-green-600 text-xs uppercase text-center">
                        Socials
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tokens.length === 0 && !loading && (
                      <TableRow>
                        <TableCell
                          colSpan={9}
                          className="text-center py-16 text-gray-600"
                        >
                          {lastUpdate
                            ? "No tokens found for current filters."
                            : 'Click "Scan" to search for new tokens.'}
                        </TableCell>
                      </TableRow>
                    )}
                    {loading && tokens.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={9}
                          className="text-center py-16 text-green-600"
                        >
                          <span className="flex items-center justify-center gap-2">
                            <svg
                              className="animate-spin h-5 w-5"
                              viewBox="0 0 24 24"
                              fill="none"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                              />
                            </svg>
                            Scanning Solana network…
                          </span>
                        </TableCell>
                      </TableRow>
                    )}
                    {pagedTokens.map((t) => {
                      const change = t.change24 ? parseFloat(t.change24) : null;
                      return (
                        <TableRow
                          key={t.token.address}
                          className="border-green-900/20 cursor-pointer hover:bg-green-950/30 transition-colors"
                          onClick={() =>
                            window.open(
                              `https://www.defined.fi/sol/${t.token.address}`,
                              "_blank"
                            )
                          }
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {t.token.info?.imageThumbUrl ? (
                                <img
                                  src={t.token.info.imageThumbUrl}
                                  alt=""
                                  className="w-8 h-8 rounded-full bg-gray-800"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display =
                                      "none";
                                  }}
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-green-900/30 flex items-center justify-center text-green-500 text-xs font-bold">
                                  {t.token.symbol?.charAt(0) ?? "?"}
                                </div>
                              )}
                              <div className="min-w-0">
                                <div className="font-medium text-gray-100 truncate max-w-[200px]">
                                  {t.token.name || "Unknown"}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {t.token.symbol || "???"}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right text-gray-300 tabular-nums">
                            {formatNumber(t.marketCap)}
                          </TableCell>
                          <TableCell className="text-right text-gray-300 tabular-nums">
                            {formatNumber(t.liquidity)}
                          </TableCell>
                          <TableCell className="text-right text-gray-300 tabular-nums">
                            {formatPrice(t.priceUSD)}
                          </TableCell>
                          <TableCell className="text-right text-gray-300 tabular-nums">
                            {formatNumber(t.volume24)}
                          </TableCell>
                          <TableCell
                            className={`text-right tabular-nums font-medium ${
                              change === null
                                ? "text-gray-500"
                                : change >= 0
                                  ? "text-green-400"
                                  : "text-red-400"
                            }`}
                          >
                            {formatChange(t.change24)}
                          </TableCell>
                          <TableCell className="text-right text-gray-400 tabular-nums">
                            {t.txnCount24?.toLocaleString() ?? "—"}
                          </TableCell>
                          <TableCell className="text-right text-gray-500 text-sm whitespace-nowrap">
                            {t.createdAt ? timeAgo(t.createdAt) : "—"}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-2">
                              {t.token.socialLinks?.twitter && (
                                <SocialIcon type="twitter" url={t.token.socialLinks.twitter} />
                              )}
                              {t.token.socialLinks?.telegram && (
                                <SocialIcon type="telegram" url={t.token.socialLinks.telegram} />
                              )}
                              {t.token.socialLinks?.discord && (
                                <SocialIcon type="discord" url={t.token.socialLinks.discord} />
                              )}
                              {t.token.socialLinks?.website && (
                                <SocialIcon type="website" url={t.token.socialLinks.website} />
                              )}
                              {t.token.socialLinks?.email && (
                                <SocialIcon type="email" url={t.token.socialLinks.email} />
                              )}
                              {!t.token.socialLinks?.twitter &&
                                !t.token.socialLinks?.telegram &&
                                !t.token.socialLinks?.discord &&
                                !t.token.socialLinks?.website &&
                                !t.token.socialLinks?.email && (
                                  <span className="text-gray-700 text-xs">—</span>
                                )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {tokens.length > MAIN_PAGE_SIZE && (
                <div className="px-4 py-3 border-t border-green-900/30 flex items-center justify-between">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={mainPage === 0}
                    className="border-green-900/50 text-gray-400 hover:text-green-400 hover:border-green-700 disabled:opacity-30"
                    onClick={() => setMainPage(mainPage - 1)}
                  >
                    ← Prev
                  </Button>
                  <span className="text-xs text-gray-500">
                    Page {mainPage + 1} of {totalPages}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={mainPage >= totalPages - 1}
                    className="border-green-900/50 text-gray-400 hover:text-green-400 hover:border-green-700 disabled:opacity-30"
                    onClick={() => setMainPage(mainPage + 1)}
                  >
                    Next →
                  </Button>
                </div>
              )}
            </div>
          );
        })()}
      </main>
    </div>
  );
}
