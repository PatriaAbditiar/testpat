export const SOLANA_NETWORK_ID = 1399811149;

export const FILTER_TOKENS_QUERY = `
  query FilterTokens($filters: TokenFilters, $rankings: [TokenRanking], $limit: Int) {
    filterTokens(filters: $filters, rankings: $rankings, limit: $limit) {
      results {
        createdAt
        liquidity
        marketCap
        priceUSD
        volume24
        change24
        txnCount24
        token {
          address
          name
          symbol
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

export interface TokenResult {
  createdAt: number;
  liquidity: string | null;
  marketCap: string | null;
  priceUSD: string | null;
  volume24: string | null;
  change24: string | null;
  txnCount24: number | null;
  token: {
    address: string;
    name: string;
    symbol: string;
    info: {
      imageThumbUrl: string | null;
    } | null;
    socialLinks: {
      twitter: string | null;
      telegram: string | null;
      discord: string | null;
      website: string | null;
      email: string | null;
    } | null;
  };
}

export interface FilterTokensResponse {
  data: {
    filterTokens: {
      results: TokenResult[];
    };
  };
  errors?: { message: string }[];
}

export async function fetchFilteredTokens(
  timeWindowSeconds: number,
  minMarketCap: number | null,
  minLiquidity: number
): Promise<TokenResult[]> {
  const now = Math.floor(Date.now() / 1000);
  const createdAfter = now - timeWindowSeconds;

  const filters: Record<string, unknown> = {
    network: [SOLANA_NETWORK_ID],
    createdAt: { gte: createdAfter },
    liquidity: { gte: minLiquidity },
  };

  if (minMarketCap !== null) {
    filters.marketCap = { gte: minMarketCap };
  }

  const res = await fetch("/api/codex", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: FILTER_TOKENS_QUERY,
      variables: {
        filters,
        rankings: [{ attribute: "marketCap", direction: "DESC" }],
        limit: 200,
      },
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

  const results: TokenResult[] = filterTokens.results ?? [];

  // Client-side filter: only keep tokens created within the time window
  return results.filter((t) => t.createdAt && t.createdAt >= createdAfter);
}
