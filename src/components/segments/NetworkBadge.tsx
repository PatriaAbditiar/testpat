import { NETWORK_IDS } from "@/lib/segment-types";

const NETWORK_MAP: Record<number, { label: string; color: string }> = {
  [NETWORK_IDS.solana]: { label: "SOL", color: "bg-green-600" },
  [NETWORK_IDS.ethereum]: { label: "ETH", color: "bg-purple-600" },
  [NETWORK_IDS.base]: { label: "BASE", color: "bg-blue-600" },
};

export function NetworkBadge({ networkId }: { networkId: number }) {
  const net = NETWORK_MAP[networkId] ?? { label: "?", color: "bg-gray-600" };
  return (
    <span
      className={`${net.color} text-white text-[10px] font-bold px-1.5 py-0.5 rounded uppercase`}
    >
      {net.label}
    </span>
  );
}
