"use client";

import { memo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SegmentTokenResult, NETWORK_IDS } from "@/lib/segment-types";
import { formatNumber, formatPrice, formatChange, daysAgo, formatLastTweet } from "@/lib/format-utils";
import { DISPLAY_PAGE_SIZE } from "@/lib/segment-query";
import { NetworkBadge } from "./NetworkBadge";
import { TokenRowSkeleton } from "./TokenRowSkeleton";
import { EmptyState } from "./EmptyState";

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function getDefinedUrl(networkId: number, address: string): string {
  const chain =
    networkId === NETWORK_IDS.ethereum
      ? "eth"
      : networkId === NETWORK_IDS.base
        ? "base"
        : "sol";
  return `https://www.defined.fi/${chain}/${address}`;
}

/* ------------------------------------------------------------------ */
/*  Memoised single-token row – prevents 100 rows re-rendering       */
/* ------------------------------------------------------------------ */

const TokenRow = memo(function TokenRow({ t }: { t: SegmentTokenResult }) {
  const change = t.change24 ? parseFloat(t.change24) : null;

  const handleRowClick = useCallback(() => {
    window.open(getDefinedUrl(t.token.networkId, t.token.address), "_blank");
  }, [t.token.networkId, t.token.address]);

  const handleBagworkClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      window.open("/bagwork/launch", "_blank");
    },
    []
  );

  return (
    <TableRow
      className="border-green-900/20 cursor-pointer hover:bg-green-950/30 transition-colors"
      onClick={handleRowClick}
    >
      {/* Token */}
      <TableCell>
        <div className="flex items-center gap-3">
          {t.token.info?.imageThumbUrl ? (
            <img
              src={t.token.info.imageThumbUrl}
              alt=""
              className="w-8 h-8 rounded-full bg-gray-800"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-green-900/30 flex items-center justify-center text-green-500 text-xs font-bold">
              {t.token.symbol?.charAt(0) ?? "?"}
            </div>
          )}
          <div className="min-w-0">
            <div className="font-medium text-gray-100 truncate max-w-[160px]">
              {t.token.name || "Unknown"}
            </div>
            <div className="text-xs text-gray-500">
              {t.token.symbol || "???"}
            </div>
          </div>
        </div>
      </TableCell>

      {/* Network */}
      <TableCell className="text-center">
        <NetworkBadge networkId={t.token.networkId} />
      </TableCell>

      {/* Age */}
      <TableCell className="text-right text-gray-400 text-sm tabular-nums">
        {t.createdAt ? daysAgo(t.createdAt) : "—"}
      </TableCell>

      {/* Price */}
      <TableCell className="text-right text-gray-300 tabular-nums">
        {formatPrice(t.priceUSD)}
      </TableCell>

      {/* Market Cap */}
      <TableCell className="text-right text-gray-300 tabular-nums">
        {formatNumber(t.marketCap)}
      </TableCell>

      {/* 24h Change */}
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

      {/* Volume */}
      <TableCell className="text-right text-gray-300 tabular-nums">
        {formatNumber(t.volume24)}
      </TableCell>

      {/* Liquidity */}
      <TableCell className="text-right text-gray-300 tabular-nums">
        {formatNumber(t.liquidity)}
      </TableCell>

      {/* Holders */}
      <TableCell className="text-right text-gray-400 tabular-nums">
        {t.holders?.toLocaleString() ?? "—"}
      </TableCell>

      {/* Twitter/X */}
      <TableCell className="text-center">
        {t.token.socialLinks?.twitter ? (
          <a
            href={t.token.socialLinks.twitter}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-gray-500 hover:text-green-400 transition-colors inline-flex"
            title="X / Twitter"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </a>
        ) : (
          <span className="text-gray-700 text-xs">—</span>
        )}
      </TableCell>

      {/* Last Tweet */}
      <TableCell className="text-right text-gray-400 text-sm tabular-nums whitespace-nowrap">
        {formatLastTweet(t.lastTweetDate)}
      </TableCell>

      {/* CTA */}
      <TableCell className="text-right">
        <Button
          size="sm"
          variant="outline"
          className="border-green-700 text-green-400 hover:bg-green-950 hover:text-green-300 text-xs h-7 px-2"
          onClick={handleBagworkClick}
        >
          Bagwork
        </Button>
      </TableCell>
    </TableRow>
  );
});

/* ------------------------------------------------------------------ */
/*  Main results component                                            */
/* ------------------------------------------------------------------ */

interface SegmentResultsProps {
  results: SegmentTokenResult[];
  totalCount: number;
  currentPage: number;
  loading: boolean;
  error: string | null;
  hasRun: boolean;
  autoRefresh: boolean;
  onPageChange: (page: number) => void;
  onToggleAutoRefresh: () => void;
}

export const SegmentResults = memo(function SegmentResults({
  results,
  totalCount,
  currentPage,
  loading,
  error,
  hasRun,
  autoRefresh,
  onPageChange,
  onToggleAutoRefresh,
}: SegmentResultsProps) {
  // Client-side pagination: slice results into pages
  const totalPages = Math.max(1, Math.ceil(results.length / DISPLAY_PAGE_SIZE));
  const pagedResults = results.slice(
    currentPage * DISPLAY_PAGE_SIZE,
    (currentPage + 1) * DISPLAY_PAGE_SIZE
  );

  return (
    <div className="border border-green-900/30 rounded-lg overflow-hidden bg-[#0d0d14]">
      {/* Results header */}
      <div className="px-4 py-3 border-b border-green-900/30 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500 uppercase tracking-wider">
            Results
          </span>
          {hasRun && (
            <span className="text-xs text-gray-600">
              {results.length} fetched
              {totalCount > results.length && ` of ${totalCount} total`}
              {results.length > DISPLAY_PAGE_SIZE &&
                ` · showing ${currentPage * DISPLAY_PAGE_SIZE + 1}–${Math.min(
                  (currentPage + 1) * DISPLAY_PAGE_SIZE,
                  results.length
                )}`}
            </span>
          )}
        </div>
        <Button
          onClick={onToggleAutoRefresh}
          size="sm"
          variant="outline"
          className={
            autoRefresh
              ? "border-green-500 text-green-400 bg-green-950/50 hover:bg-green-950"
              : "border-green-900/50 text-gray-400 hover:text-green-400 hover:border-green-700"
          }
        >
          {autoRefresh ? "⏸ Auto (5m)" : "▶ Auto (5m)"}
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="px-4 py-3 bg-red-950/50 border-b border-red-800 text-red-400 text-sm">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-green-900/30 hover:bg-transparent">
              <TableHead className="text-green-600 text-xs uppercase">
                Token
              </TableHead>
              <TableHead className="text-green-600 text-xs uppercase text-center">
                Net
              </TableHead>
              <TableHead className="text-green-600 text-xs uppercase text-right">
                Age
              </TableHead>
              <TableHead className="text-green-600 text-xs uppercase text-right">
                Price
              </TableHead>
              <TableHead className="text-green-600 text-xs uppercase text-right">
                Mcap
              </TableHead>
              <TableHead className="text-green-600 text-xs uppercase text-right">
                24h %
              </TableHead>
              <TableHead className="text-green-600 text-xs uppercase text-right">
                Vol 24h
              </TableHead>
              <TableHead className="text-green-600 text-xs uppercase text-right">
                Liquidity
              </TableHead>
              <TableHead className="text-green-600 text-xs uppercase text-right">
                Holders
              </TableHead>
              <TableHead className="text-green-600 text-xs uppercase text-center">
                X
              </TableHead>
              <TableHead className="text-green-600 text-xs uppercase text-right">
                Last Tweet
              </TableHead>
              <TableHead className="text-green-600 text-xs uppercase text-right">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Loading */}
            {loading && results.length === 0 && (
              <>
                {Array.from({ length: 8 }).map((_, i) => (
                  <TokenRowSkeleton key={i} />
                ))}
              </>
            )}

            {/* Empty */}
            {!loading && results.length === 0 && (
              <TableRow>
                <TableCell colSpan={12}>
                  {hasRun ? (
                    <EmptyState
                      title="No tokens found"
                      description="Try adjusting your filters — lower the minimums or broaden the time window."
                    />
                  ) : (
                    <EmptyState
                      title="Ready to scan"
                      description='Set your filter criteria above and click "Run Segment" to find tokens.'
                    />
                  )}
                </TableCell>
              </TableRow>
            )}

            {/* Results rows — paginated client-side */}
            {pagedResults.map((t) => (
              <TokenRow
                key={`${t.token.networkId}-${t.token.address}`}
                t={t}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination — client-side */}
      {results.length > DISPLAY_PAGE_SIZE && (
        <div className="px-4 py-3 border-t border-green-900/30 flex items-center justify-between">
          <Button
            size="sm"
            variant="outline"
            disabled={currentPage === 0}
            className="border-green-900/50 text-gray-400 hover:text-green-400 hover:border-green-700 disabled:opacity-30"
            onClick={() => onPageChange(currentPage - 1)}
          >
            ← Prev
          </Button>
          <span className="text-xs text-gray-500">
            Page {currentPage + 1} of {totalPages}
          </span>
          <Button
            size="sm"
            variant="outline"
            disabled={currentPage >= totalPages - 1}
            className="border-green-900/50 text-gray-400 hover:text-green-400 hover:border-green-700 disabled:opacity-30"
            onClick={() => onPageChange(currentPage + 1)}
          >
            Next →
          </Button>
        </div>
      )}
    </div>
  );
});
