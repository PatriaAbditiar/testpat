"use client";

import { SavedSegment } from "@/lib/segment-types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface SegmentSidebarProps {
  segments: SavedSegment[];
  activeSegmentId: string | null;
  onSelect: (segment: SavedSegment) => void;
  onDelete: (id: string) => void;
  open: boolean;
  onToggle: () => void;
}

export function SegmentSidebar({
  segments,
  activeSegmentId,
  onSelect,
  onDelete,
  open,
  onToggle,
}: SegmentSidebarProps) {
  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={onToggle}
        className="md:hidden flex items-center gap-2 text-sm text-gray-400 hover:text-green-400 px-1 py-2"
      >
        <svg
          className={`w-4 h-4 transition-transform ${open ? "rotate-90" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m9 5 7 7-7 7" />
        </svg>
        Saved Segments ({segments.length})
      </button>

      {/* Sidebar panel */}
      <div
        className={`
          ${open ? "block" : "hidden"} md:block
          w-full md:w-[260px] md:shrink-0
          bg-[#0d0d14] border border-green-900/30 rounded-lg overflow-hidden
        `}
      >
        <div className="px-4 py-3 border-b border-green-900/30">
          <h2 className="text-xs font-bold text-green-400 uppercase tracking-wider">
            Saved Segments
          </h2>
        </div>

        {segments.length === 0 ? (
          <div className="px-4 py-8 text-center text-gray-600 text-sm">
            No saved segments yet.
            <br />
            <span className="text-gray-700 text-xs">
              Build filters and click Save.
            </span>
          </div>
        ) : (
          <ScrollArea className="max-h-[60vh] md:max-h-[calc(100vh-200px)]">
            <div className="p-2 space-y-1">
              {segments.map((seg, i) => (
                <div key={seg.id}>
                  {i > 0 && <Separator className="bg-green-900/20 my-1" />}
                  <div
                    onClick={() => onSelect(seg)}
                    className={`
                      group flex items-center justify-between px-3 py-2.5 rounded-md cursor-pointer transition-colors
                      ${
                        activeSegmentId === seg.id
                          ? "bg-green-950/50 border border-green-700/50"
                          : "hover:bg-green-950/30 border border-transparent"
                      }
                    `}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-sm text-gray-200 font-medium truncate">
                        {seg.name}
                      </div>
                      <div className="text-xs text-gray-600 mt-0.5">
                        {seg.lastResultCount != null
                          ? `${seg.lastResultCount} tokens`
                          : "Not run yet"}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(seg.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all ml-2 shrink-0"
                      title="Delete segment"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6 18 18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    </>
  );
}
