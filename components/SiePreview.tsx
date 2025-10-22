"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AggregatedVoucher, Settings } from "@/types";

type Props = {
  vouchers: AggregatedVoucher[];
  settings: Settings;
  limit?: number;
};

export function SiePreview({ vouchers, settings, limit = 50 }: Props) {
  const rows = vouchers.slice(0, limit);
  const series = settings.voucherSeries;
  const showOrders = settings.grouping === "payoutDate";

  return (
    <div className="rounded-2xl p-0 md:p-0 bg-gradient-to-br from-white to-zinc-50 dark:from-zinc-900 dark:to-zinc-950 border border-zinc-200/70 dark:border-zinc-700/60 shadow-sm">
      <div className="overflow-x-auto rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="whitespace-nowrap w-0">
                <div className="leading-tight">
                  <div className="font-medium">Verifikationsnummer</div>
                </div>
              </TableHead>
              <TableHead className="whitespace-nowrap w-0">
                <div className="leading-tight">
                  <div className="font-medium">Bokföringsdatum</div>
                </div>
              </TableHead>
              {showOrders && (
                <TableHead className="whitespace-nowrap w-0">
                  <div className="leading-tight">
                    <div className="font-medium">Antal orders</div>
                  </div>
                </TableHead>
              )}
              <TableHead className="w-full">
                <div className="leading-tight">
                  <div className="font-medium">Beskrivning</div>
                </div>
              </TableHead>
              <TableHead className="whitespace-nowrap w-0">
                <div className="leading-tight">
                  <div className="font-medium">Bank</div>
                  <div className="text-xs text-muted-foreground">
                    {settings.accounts.bankAccount} Debet
                  </div>
                </div>
              </TableHead>
              <TableHead className="whitespace-nowrap w-0">
                <div className="leading-tight">
                  <div className="font-medium">Avgifter</div>
                  <div className="text-xs text-muted-foreground">
                    {settings.accounts.feesAccount} Debet
                  </div>
                </div>
              </TableHead>
              <TableHead className="whitespace-nowrap w-0">
                <div className="leading-tight">
                  <div className="font-medium">Försäljning ex moms</div>
                  <div className="text-xs text-muted-foreground">
                    {settings.accounts.salesAccount} Kredit
                  </div>
                </div>
              </TableHead>
              <TableHead className="whitespace-nowrap w-0">
                <div className="leading-tight">
                  <div className="font-medium">Utgående moms</div>
                  <div className="text-xs text-muted-foreground">
                    {settings.accounts.outputVatAccount} Kredit
                  </div>
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((v, idx) => {
              const verNum = 1 + idx;
              const debitBank = round2(v.totalNet);
              const debitFees = round2(v.totalFees);
              const creditSalesExVat = round2(v.totalGross - v.totalVat);
              const creditVat = round2(v.totalVat);
              return (
                <TableRow key={`${v.dateYmd}-${idx}`}>
                  <TableCell className="whitespace-nowrap w-0">{`${series}${verNum}`}</TableCell>
                  <TableCell className="whitespace-nowrap w-0">
                    {formatYmdIso(v.dateYmd)}
                  </TableCell>
                  {showOrders && (
                    <TableCell className="whitespace-nowrap w-0">
                      {v.orderCount ?? 0}
                    </TableCell>
                  )}
                  <TableCell className="w-full max-w-[1px] truncate">
                    {v.description ?? ""}
                  </TableCell>
                  <TableCell className="whitespace-nowrap w-0">
                    {formatAmount(debitBank)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap w-0">
                    {formatAmount(debitFees)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap w-0">
                    -{formatAmount(creditSalesExVat)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap w-0">
                    -{formatAmount(creditVat)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export function formatAmount(n: number) {
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatYmdIso(ymd: string) {
  if (!/^[0-9]{8}$/.test(ymd)) return ymd;
  const y = ymd.slice(0, 4);
  const m = ymd.slice(4, 6);
  const d = ymd.slice(6, 8);
  return `${y}-${m}-${d}`;
}
