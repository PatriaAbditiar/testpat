"use client";

import { TableCell, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

export function TokenRowSkeleton() {
  return (
    <TableRow className="border-green-900/20">
      <TableCell>
        <div className="flex items-center gap-3">
          <Skeleton className="w-8 h-8 rounded-full bg-green-900/20" />
          <div className="space-y-1">
            <Skeleton className="h-4 w-24 bg-green-900/20" />
            <Skeleton className="h-3 w-12 bg-green-900/20" />
          </div>
        </div>
      </TableCell>
      <TableCell><Skeleton className="h-4 w-10 bg-green-900/20 mx-auto" /></TableCell>
      <TableCell className="text-right"><Skeleton className="h-4 w-8 bg-green-900/20 ml-auto" /></TableCell>
      <TableCell className="text-right"><Skeleton className="h-4 w-16 bg-green-900/20 ml-auto" /></TableCell>
      <TableCell className="text-right"><Skeleton className="h-4 w-14 bg-green-900/20 ml-auto" /></TableCell>
      <TableCell className="text-right"><Skeleton className="h-4 w-14 bg-green-900/20 ml-auto" /></TableCell>
      <TableCell className="text-right"><Skeleton className="h-4 w-14 bg-green-900/20 ml-auto" /></TableCell>
      <TableCell className="text-right"><Skeleton className="h-4 w-14 bg-green-900/20 ml-auto" /></TableCell>
      <TableCell className="text-right"><Skeleton className="h-4 w-12 bg-green-900/20 ml-auto" /></TableCell>
      <TableCell className="text-center"><Skeleton className="h-4 w-4 bg-green-900/20 mx-auto" /></TableCell>
      <TableCell className="text-right"><Skeleton className="h-4 w-14 bg-green-900/20 ml-auto" /></TableCell>
      <TableCell><Skeleton className="h-7 w-20 bg-green-900/20 ml-auto" /></TableCell>
    </TableRow>
  );
}
