"use client";

import { memo } from "react";
import { Button } from "@/components/ui/button";
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
  SegmentFilters,
  NetworkKey,
  NETWORK_LABELS,
  TOKEN_AGE_OPTIONS,
  LAST_TXN_OPTIONS,
  LAST_TWEET_OPTIONS,
  LAUNCHPAD_OPTIONS,
  AMM_OPTIONS,
  TokenAgePreset,
  LastTxnPreset,
  LastTweetPreset,
} from "@/lib/segment-types";

function toggleArrayValue(arr: string[], value: string): string[] {
  return arr.includes(value)
    ? arr.filter((v) => v !== value)
    : [...arr, value];
}

const NETWORKS: NetworkKey[] = ["all", "solana", "ethereum", "base"];

interface SegmentFormProps {
  filters: SegmentFilters;
  segmentName: string;
  loading: boolean;
  onFiltersChange: (filters: SegmentFilters) => void;
  onSegmentNameChange: (name: string) => void;
  onRun: () => void;
  onSave: () => void;
  onReset: () => void;
}

export const SegmentForm = memo(function SegmentForm({
  filters,
  segmentName,
  loading,
  onFiltersChange,
  onSegmentNameChange,
  onRun,
  onSave,
  onReset,
}: SegmentFormProps) {
  // Defensive: ensure arrays even if old data sneaks through
  const launchpad = Array.isArray(filters.launchpad) ? filters.launchpad : [];
  const amm = Array.isArray(filters.amm) ? filters.amm : [];

  const update = (partial: Partial<SegmentFilters>) => {
    onFiltersChange({ ...filters, ...partial });
  };

  const numericOnly = (val: string) => val.replace(/[^0-9.-]/g, "");

  return (
    <div className="bg-[#0d0d14] border border-green-900/30 rounded-lg p-5 space-y-5">
      <h2 className="text-sm font-bold text-green-400 uppercase tracking-wider">
        Filter Criteria
      </h2>

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
              variant={filters.network === net ? "default" : "outline"}
              className={
                filters.network === net
                  ? "bg-green-600 hover:bg-green-700 text-white border-green-600"
                  : "border-green-900/50 text-gray-400 hover:text-green-400 hover:border-green-700"
              }
              onClick={() => update({ network: net })}
            >
              {NETWORK_LABELS[net]}
            </Button>
          ))}
        </div>
      </div>

      {/* Row: Token Age + Last Transaction + Last Tweet */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-2">
          <label className="text-xs text-gray-500 uppercase tracking-wider">
            Token Age
          </label>
          <Select
            value={filters.tokenAge}
            onValueChange={(v) => update({ tokenAge: v as TokenAgePreset })}
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
            value={filters.lastTransaction}
            onValueChange={(v) =>
              update({ lastTransaction: v as LastTxnPreset })
            }
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

        <div className="space-y-2">
          <label className="text-xs text-gray-500 uppercase tracking-wider">
            Last Tweet
          </label>
          <Select
            value={filters.lastTweet ?? "any"}
            onValueChange={(v) =>
              update({ lastTweet: v as LastTweetPreset })
            }
          >
            <SelectTrigger className="border-green-900/50 bg-transparent text-gray-200 focus:ring-green-600">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#0d0d14] border-green-900/50">
              {LAST_TWEET_OPTIONS.map((opt) => (
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
          {launchpad.length > 0 && (
            <button
              type="button"
              onClick={() => update({ launchpad: [] })}
              className="text-[10px] text-gray-600 hover:text-green-400 transition-colors"
            >
              Clear ({launchpad.length})
            </button>
          )}
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {LAUNCHPAD_OPTIONS.map((opt) => {
            const active = launchpad.includes(opt.value);
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
                  update({ launchpad: toggleArrayValue(launchpad, opt.value) })
                }
              >
                {opt.label}
              </Button>
            );
          })}
        </div>
        {launchpad.length === 0 && (
          <p className="text-[10px] text-gray-600">None selected = all launchpads</p>
        )}
      </div>

      {/* AMM / DEX (multi-select) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs text-gray-500 uppercase tracking-wider">
            AMM / DEX
          </label>
          {amm.length > 0 && (
            <button
              type="button"
              onClick={() => update({ amm: [] })}
              className="text-[10px] text-gray-600 hover:text-green-400 transition-colors"
            >
              Clear ({amm.length})
            </button>
          )}
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {AMM_OPTIONS.map((opt) => {
            const active = amm.includes(opt.value);
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
                  update({ amm: toggleArrayValue(amm, opt.value) })
                }
              >
                {opt.label}
              </Button>
            );
          })}
        </div>
        {amm.length === 0 && (
          <p className="text-[10px] text-gray-600">None selected = all DEXes</p>
        )}
      </div>

      {/* Row: Price Change Min/Max */}
      <div className="space-y-2">
        <label className="text-xs text-gray-500 uppercase tracking-wider">
          Price Change 24h (%)
        </label>
        <div className="grid grid-cols-2 gap-3">
          <Input
            type="text"
            inputMode="numeric"
            placeholder="Min %"
            value={filters.priceChangeMin}
            onChange={(e) =>
              update({ priceChangeMin: numericOnly(e.target.value) })
            }
            className="border-green-900/50 bg-transparent text-gray-200 placeholder:text-gray-600 focus-visible:ring-green-600"
          />
          <Input
            type="text"
            inputMode="numeric"
            placeholder="Max %"
            value={filters.priceChangeMax}
            onChange={(e) =>
              update({ priceChangeMax: numericOnly(e.target.value) })
            }
            className="border-green-900/50 bg-transparent text-gray-200 placeholder:text-gray-600 focus-visible:ring-green-600"
          />
        </div>
      </div>

      {/* Row: Volume, Liquidity, MarketCap */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-2">
          <label className="text-xs text-gray-500 uppercase tracking-wider">
            Min Volume 24h ($)
          </label>
          <Input
            type="text"
            inputMode="numeric"
            placeholder="e.g. 10000"
            value={filters.volume24Min}
            onChange={(e) =>
              update({ volume24Min: numericOnly(e.target.value) })
            }
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
            value={filters.liquidityMin}
            onChange={(e) =>
              update({ liquidityMin: numericOnly(e.target.value) })
            }
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
            value={filters.marketCapMin}
            onChange={(e) =>
              update({ marketCapMin: numericOnly(e.target.value) })
            }
            className="border-green-900/50 bg-transparent text-gray-200 placeholder:text-gray-600 focus-visible:ring-green-600"
          />
        </div>
      </div>

      {/* Row: Holders + Checkbox */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
        <div className="space-y-2">
          <label className="text-xs text-gray-500 uppercase tracking-wider">
            Min Holders
          </label>
          <Input
            type="text"
            inputMode="numeric"
            placeholder="e.g. 100"
            value={filters.holdersMin}
            onChange={(e) =>
              update({ holdersMin: numericOnly(e.target.value) })
            }
            className="border-green-900/50 bg-transparent text-gray-200 placeholder:text-gray-600 focus-visible:ring-green-600"
          />
        </div>
        <div className="flex items-center gap-2 h-9">
          <Checkbox
            id="moreSells"
            checked={filters.moreSellsThanBuys}
            onCheckedChange={(checked) =>
              update({ moreSellsThanBuys: checked === true })
            }
            className="border-green-900/50 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
          />
          <label
            htmlFor="moreSells"
            className="text-sm text-gray-400 cursor-pointer select-none"
          >
            More sells than buys (24h)
          </label>
        </div>
      </div>

      {/* Segment name + actions */}
      <div className="border-t border-green-900/30 pt-4 space-y-3">
        <div className="flex gap-3 items-end flex-wrap">
          <div className="flex-1 min-w-[200px] space-y-2">
            <label className="text-xs text-gray-500 uppercase tracking-wider">
              Segment Name
            </label>
            <Input
              type="text"
              placeholder="My Segment"
              value={segmentName}
              onChange={(e) => onSegmentNameChange(e.target.value)}
              className="border-green-900/50 bg-transparent text-gray-200 placeholder:text-gray-600 focus-visible:ring-green-600"
            />
          </div>
          <Button
            size="sm"
            variant="outline"
            className="border-green-900/50 text-gray-400 hover:text-green-400 hover:border-green-700"
            onClick={onSave}
            disabled={!segmentName.trim()}
          >
            Save
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-green-900/50 text-gray-400 hover:text-green-400 hover:border-green-700"
            onClick={onReset}
          >
            Reset
          </Button>
          <Button
            size="sm"
            onClick={onRun}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 text-white font-bold px-8"
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
                Running…
              </span>
            ) : (
              "Run Segment"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
});
