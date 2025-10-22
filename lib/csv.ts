import Papa from "papaparse";
import { NormalizedEntry, ShopifyTransactionRow } from "@/types";

export function isShopifyTransactionsHeader(header: string[]): boolean {
  const required = [
    "Transaction Date",
    "Type",
    "Payout Date",
    "Amount",
    "Fee",
    "Net",
  ];
  return required.every((h) => header.includes(h));
}

export function parseTransactionsCsv(text: string): NormalizedEntry[] {
  const parsed = Papa.parse<ShopifyTransactionRow>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });

  const rows = (parsed.data || []).filter(
    (r) => !!r["Payout Date"]
  ) as ShopifyTransactionRow[];

  const normalizeDate = (isoish: string): string => {
    // Accept formats like "2025-10-03" or with time zone; keep date part
    const d = new Date(isoish);
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    return `${y}${m}${day}`;
  };

  return rows.map((r) => {
    const payoutDateYmd = normalizeDate(String(r["Payout Date"])).toString();
    const amount = Number((r.Amount as string) ?? "0");
    const fee = Math.abs(Number((r.Fee as string) ?? "0"));
    const vatCsv = Number((r.VAT as string) ?? "0");
    const netCsv = Number((r.Net as string) ?? amount - fee);

    const vatAmount = vatCsv >= 0 ? vatCsv : 0;
    const grossAmount = amount;
    const netAmount = Number((grossAmount - fee).toFixed(2));

    return {
      payoutDateYmd,
      grossAmount,
      vatAmount,
      feeAmount: fee,
      netAmount: Math.abs(netCsv) > 0 ? netCsv : netAmount,
      orderId: String(r["Order"] ?? "").trim(),
    } satisfies NormalizedEntry;
  });
}

export function aggregateByPayoutDate(entries: NormalizedEntry[]) {
  const byDate: Record<
    string,
    { gross: number; vat: number; fees: number; net: number; count: number }
  > = {};
  for (const e of entries) {
    byDate[e.payoutDateYmd] ??= { gross: 0, vat: 0, fees: 0, net: 0, count: 0 };
    byDate[e.payoutDateYmd].gross += e.grossAmount;
    byDate[e.payoutDateYmd].vat += e.vatAmount;
    byDate[e.payoutDateYmd].fees += e.feeAmount;
    byDate[e.payoutDateYmd].net += e.netAmount;
    byDate[e.payoutDateYmd].count += 1;
  }
  return Object.entries(byDate)
    .map(([dateYmd, sums]) => ({
      dateYmd,
      totalGross: round2(sums.gross),
      totalVat: round2(sums.vat),
      totalFees: round2(sums.fees),
      totalNet: round2(sums.net),
      orderCount: sums.count,
      description: `Shopify beställningar ${dateYmd.slice(
        0,
        4
      )}-${dateYmd.slice(4, 6)}-${dateYmd.slice(6, 8)}`,
    }))
    .sort((a, b) => a.dateYmd.localeCompare(b.dateYmd));
}

export function perOrderVouchers(entries: NormalizedEntry[]) {
  return entries.map((e) => ({
    dateYmd: e.payoutDateYmd,
    totalGross: round2(e.grossAmount),
    totalVat: round2(e.vatAmount),
    totalFees: round2(e.feeAmount),
    totalNet: round2(e.netAmount),
    orderCount: 1,
    description: e.orderId ? `Shopify beställning ${e.orderId}` : undefined,
  }));
}

export function maybeApplyVatRate(
  entries: NormalizedEntry[],
  vatRatePercent: number
) {
  // If CSV provides VAT (often 0), recompute from gross when VAT is 0
  return entries.map((e) => {
    if (e.vatAmount > 0) return e;
    const rate = vatRatePercent / 100;
    const salesExVat = e.grossAmount / (1 + rate);
    const vat = e.grossAmount - salesExVat;
    return { ...e, vatAmount: round2(vat) } as NormalizedEntry;
  });
}

export function round2(n: number) {
  return Math.round(n * 100) / 100;
}
