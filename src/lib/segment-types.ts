export const NETWORK_IDS = {
  solana: 1399811149,
  ethereum: 1,
  base: 8453,
} as const;

export type NetworkKey = keyof typeof NETWORK_IDS | "all";

export const NETWORK_LABELS: Record<NetworkKey, string> = {
  all: "All",
  solana: "Solana",
  ethereum: "Ethereum",
  base: "Base",
};

export const NETWORK_COLORS: Record<NetworkKey, string> = {
  all: "bg-gray-600",
  solana: "bg-green-600",
  ethereum: "bg-purple-600",
  base: "bg-blue-600",
};

export type TokenAgePreset = "any" | "0-7d" | "7-30d" | "30-90d" | "90d+";

export const TOKEN_AGE_OPTIONS: { label: string; value: TokenAgePreset }[] = [
  { label: "Any", value: "any" },
  { label: "< 7 days", value: "0-7d" },
  { label: "7–30 days", value: "7-30d" },
  { label: "30–90 days", value: "30-90d" },
  { label: "90+ days", value: "90d+" },
];

export type LastTxnPreset = "any" | "1h" | "6h" | "24h" | "48h" | "7d";

export const LAST_TXN_OPTIONS: { label: string; value: LastTxnPreset }[] = [
  { label: "Any", value: "any" },
  { label: "Within 1h", value: "1h" },
  { label: "Within 6h", value: "6h" },
  { label: "Within 24h", value: "24h" },
  { label: "Within 48h", value: "48h" },
  { label: "Within 7d", value: "7d" },
];

export type LastTweetPreset = "any" | "1d" | "3d" | "7d" | "30d" | "90d";

export const LAST_TWEET_OPTIONS: { label: string; value: LastTweetPreset }[] = [
  { label: "Any", value: "any" },
  { label: "Within 1 day", value: "1d" },
  { label: "Within 3 days", value: "3d" },
  { label: "Within 7 days", value: "7d" },
  { label: "Within 30 days", value: "30d" },
  { label: "Within 90 days", value: "90d" },
];

export const LAST_TWEET_SECONDS: Record<string, number> = {
  "1d": 86400,
  "3d": 259200,
  "7d": 604800,
  "30d": 2592000,
  "90d": 7776000,
};

// Launchpad options (multi-select: empty array = any)
// Values must match exact Codex API launchpad names
export const LAUNCHPAD_OPTIONS: { label: string; value: string }[] = [
  { label: "Pump.fun", value: "Pump.fun" },
  { label: "Pump Mayhem", value: "Pump Mayhem" },
  { label: "Moonshot", value: "Moonshot" },
  { label: "Moonit", value: "Moonit" },
  { label: "LaunchLab", value: "LaunchLab" },
  { label: "Believe", value: "Believe" },
  { label: "Jupiter Studio", value: "Jupiter Studio" },
  { label: "Bonk", value: "Bonk" },
  { label: "BONAD.fun", value: "BONAD.fun" },
  { label: "Nad.Fun", value: "Nad.Fun" },
  { label: "boop", value: "boop" },
  { label: "Clanker", value: "Clanker" },
  { label: "Clanker V4", value: "Clanker V4" },
  { label: "Virtuals", value: "Virtuals" },
  { label: "Zora", value: "Zora" },
  { label: "Zora Creator", value: "Zora Creator" },
  { label: "Zora Solana", value: "Zora Solana" },
  { label: "Four.meme", value: "Four.meme" },
  { label: "Four.meme Fair", value: "Four.meme Fair" },
  { label: "BAGS", value: "BAGS" },
  { label: "time.fun", value: "time.fun" },
  { label: "Baseapp", value: "Baseapp" },
  { label: "Baseapp Creator", value: "Baseapp Creator" },
  { label: "Heaven", value: "Heaven" },
  { label: "TokenMill V2", value: "TokenMill V2" },
  { label: "ArenaTrade", value: "ArenaTrade" },
  { label: "MeteoraDBС", value: "MeteoradBC" },
  { label: "Cooking.City", value: "Cooking.City" },
  { label: "Flaunch", value: "Flaunch" },
  { label: "Bankr", value: "Bankr" },
  { label: "Printr", value: "Printr" },
  { label: "Coinbarrel", value: "Coinbarrel" },
];

// AMM / DEX options (multi-select: empty array = any)
export const AMM_OPTIONS: { label: string; value: string }[] = [
  { label: "Raydium V4", value: "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8" },
  { label: "Raydium CPMM", value: "CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C" },
  { label: "Raydium CLMM", value: "CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK" },
  { label: "Orca Whirlpool", value: "whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc" },
  { label: "Meteora DLMM", value: "LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo" },
  { label: "Meteora Pools", value: "Eo7WjKq67rjJQSZxS6z3YkapzY3eMj6Xy8X5EQVn5UaB" },
  { label: "Pump.fun AMM", value: "pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA" },
];

export interface SegmentFilters {
  network: NetworkKey;
  tokenAge: TokenAgePreset;
  priceChangeMin: string;
  priceChangeMax: string;
  volume24Min: string;
  liquidityMin: string;
  marketCapMin: string;
  holdersMin: string;
  moreSellsThanBuys: boolean;
  lastTransaction: LastTxnPreset;
  lastTweet: LastTweetPreset;
  launchpad: string[];
  amm: string[];
}

export const DEFAULT_FILTERS: SegmentFilters = {
  network: "solana",
  tokenAge: "any",
  priceChangeMin: "",
  priceChangeMax: "",
  volume24Min: "",
  liquidityMin: "1000",
  marketCapMin: "",
  holdersMin: "",
  moreSellsThanBuys: false,
  lastTransaction: "any",
  lastTweet: "any",
  launchpad: [],
  amm: [],
};

export interface SavedSegment {
  id: string;
  name: string;
  filters: SegmentFilters;
  createdAt: number;
  lastRunAt: number | null;
  lastResultCount: number | null;
}

export interface SegmentTokenResult {
  createdAt: number;
  lastTransaction: number | null;
  liquidity: string | null;
  marketCap: string | null;
  priceUSD: string | null;
  volume24: string | null;
  change24: string | null;
  buyCount24: number | null;
  sellCount24: number | null;
  txnCount24: number | null;
  holders: number | null;
  /** ISO date string from Radar API, e.g. "2026-02-27T10:12:14.000Z" */
  lastTweetDate: string | null;
  token: {
    address: string;
    name: string;
    symbol: string;
    networkId: number;
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

export interface SegmentFilterResponse {
  data: {
    filterTokens: {
      count: number;
      results: SegmentTokenResult[];
    };
  };
  errors?: { message: string }[];
}
