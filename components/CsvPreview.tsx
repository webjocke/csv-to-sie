"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Props = {
  rows: Record<string, string | number | null | undefined>[];
  limit?: number;
};

export function CsvPreview({ rows, limit = 20 }: Props) {
  if (!rows.length) return null;
  const headers = Array.from(
    rows.reduce((set, row) => {
      Object.keys(row).forEach((k) => set.add(k));
      return set;
    }, new Set<string>())
  );

  const showRows = rows.slice(0, limit);

  return (
    <div className="overflow-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {headers.map((h) => (
              <TableHead key={h}>{h}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {showRows.map((row, idx) => (
            <TableRow key={idx}>
              {headers.map((h) => (
                <TableCell key={h}>{String(row[h] ?? "")}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
