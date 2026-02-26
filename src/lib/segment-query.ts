import {
  NETWORK_IDS,
  SegmentFilters,
  SegmentTokenResult,
} from "./segment-types";

export const SEGMENT_FILTER_QUERY = `
  query SegmentFilterTokens(
    $filters: TokenFilters,
    $statsType: TokenPairStatisticsType,
    $rankings: [TokenRanking],
    $limit: Int,
    $offset: Int
  ) {
    filterTokens(
      filters: $filters,
      statsType: $statsType,
      rankings: $rankings,
      limit: $limit,
      offset: $offset
    ) {
      count
      results {
        createdAt
        lastTransaction
        liquidity
        marketCap
        priceUSD
        volume24
        change24
        buyCount24
        sellCount24
        txnCount24
        holders
        token {
          address
          name
          symbol
          networkId
          info {
            imageThumbUrl
          }
          socialLinks {
            twitter
            telegram
            discord
            website
            email
          }
        }
      }
    }
  }
`;

/** How many tokens to fetch per API call (internal batching) */
const API_BATCH = 200;

/** Max total tokens to fetch across all batches */
const MAX_TOTAL = 1000;

/** How many tokens to display per page in the UI */
export const DISPLAY_PAGE_SIZE = 100;

const LAST_TXN_SECONDS: Record<string, number> = {
  "1h": 3600,
  "6h": 21600,
  "24h": 86400,
  "48h": 172800,
  "7d": 604800,
};

const TOKEN_AGE_RANGES: Record<
  string,
  { gte?: number; lte?: number } | null
> = {
  any: null,
  "0-7d": { gte: -7 },
  "7-30d": { gte: -30, lte: -7 },
  "30-90d": { gte: -90, lte: -30 },
  "90d+": { lte: -90 },
};

export function buildFilterVariables(
  filters: SegmentFilters,
  limit: number,
  offset: number
): Record<string, unknown> {
  const now = Math.floor(Date.now() / 1000);
  const apiFilters: Record<string, unknown> = {
    trendingIgnored: false,
  };

  // Network
  if (filters.network !== "all") {
    apiFilters.network = [NETWORK_IDS[filters.network]];
  }

  // Token age
  const ageRange = TOKEN_AGE_RANGES[filters.tokenAge];
  if (ageRange) {
    const createdAt: Record<string, number> = {};
    if (ageRange.gte !== undefined) createdAt.gte = now + ageRange.gte * 86400;
    if (ageRange.lte !== undefined) createdAt.lte = now + ageRange.lte * 86400;
    apiFilters.createdAt = createdAt;
  }

  // Price change 24h (user enters %, API expects decimal)
  const changeFilter: Record<string, number> = {};
  const minChange = parseFloat(filters.priceChangeMin);
  const maxChange = parseFloat(filters.priceChangeMax);
  if (!isNaN(minChange)) changeFilter.gte = minChange / 100;
  if (!isNaN(maxChange)) changeFilter.lte = maxChange / 100;
  if (Object.keys(changeFilter).length > 0) apiFilters.change24 = changeFilter;

  // Volume 24h
  const vol = parseFloat(filters.volume24Min);
  if (!isNaN(vol) && vol > 0) apiFilters.volume24 = { gte: vol };

  // Liquidity
  const liq = parseFloat(filters.liquidityMin);
  if (!isNaN(liq) && liq > 0) apiFilters.liquidity = { gte: liq };

  // Market cap
  const mcap = parseFloat(filters.marketCapMin);
  if (!isNaN(mcap) && mcap > 0) apiFilters.marketCap = { gte: mcap };

  // Holders
  const holders = parseFloat(filters.holdersMin);
  if (!isNaN(holders) && holders > 0) apiFilters.holders = { gte: holders };

  // Last transaction
  if (filters.lastTransaction !== "any") {
    const seconds = LAST_TXN_SECONDS[filters.lastTransaction];
    if (seconds) apiFilters.lastTransaction = { gte: now - seconds };
  }

  // Launchpad (multi-select)
  if (filters.launchpad && filters.launchpad.length > 0) {
    apiFilters.launchpadName = filters.launchpad;
  }

  // AMM / Exchange (multi-select)
  if (filters.amm && filters.amm.length > 0) {
    apiFilters.exchangeAddress = filters.amm;
  }

  return {
    filters: apiFilters,
    statsType: "FILTERED",
    rankings: [{ attribute: "volume24", direction: "DESC" }],
    limit,
    offset,
  };
}

export interface SegmentFetchResult {
  results: SegmentTokenResult[];
  totalCount: number;
}

/** Fetch a single batch from the API */
async function fetchBatch(
  filters: SegmentFilters,
  limit: number,
  offset: number
): Promise<{ results: SegmentTokenResult[]; count: number }> {
  const variables = buildFilterVariables(filters, limit, offset);

  const res = await fetch("/api/codex", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: SEGMENT_FILTER_QUERY,
      variables,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }

  const json = await res.json();

  if (json.errors?.length) {
    throw new Error(json.errors.map((e: { message: string }) => e.message).join(", "));
  }

  if (json.error) {
    throw new Error(json.error);
  }

  const filterTokens = json?.data?.filterTokens;
  if (!filterTokens) {
    throw new Error("Unexpected API response — no filterTokens data");
  }

  return {
    results: filterTokens.results ?? [],
    count: filterTokens.count ?? 0,
  };
}

/**
 * Fetch ALL tokens matching the filters from the API.
 * Batches requests of API_BATCH (200) until all results are retrieved,
 * capped at MAX_TOTAL (1000).
 */
export async function fetchSegmentTokens(
  filters: SegmentFilters
): Promise<SegmentFetchResult> {
  // First batch
  const first = await fetchBatch(filters, API_BATCH, 0);
  let allResults = first.results;
  const totalCount = first.count;

  // Fetch remaining batches if there are more results
  const toFetch = Math.min(totalCount, MAX_TOTAL);
  while (allResults.length < toFetch) {
    const batch = await fetchBatch(filters, API_BATCH, allResults.length);
    if (batch.results.length === 0) break; // safety: no more results
    allResults = allResults.concat(batch.results);
  }

  // Client-side: filter for "more sells than buys"
  if (filters.moreSellsThanBuys) {
    allResults = allResults.filter(
      (t) =>
        t.sellCount24 != null &&
        t.buyCount24 != null &&
        t.sellCount24 > t.buyCount24
    );
  }

  return { results: allResults, totalCount };
}
