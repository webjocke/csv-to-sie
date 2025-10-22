export type AccountMapping = {
  bankAccount: string; // e.g., 1930
  salesAccount: string; // e.g., 3001
  outputVatAccount: string; // e.g., 2611
  feesAccount: string; // e.g., 6570
  inputVatAccount?: string; // e.g., 2641 (optional, not used in v1)
};

export type Settings = {
  companyName: string;
  orgNumber: string; // 10 digits or personal number
  fiscalYearStart: string; // YYYYMMDD
  fiscalYearEnd: string; // YYYYMMDD
  authorName: string; // for #GEN line
  sieType: 4; // fixed to 4
  voucherSeries: string; // e.g., "A"
  vatRatePercent: number; // e.g., 25
  grouping: "perOrder" | "payoutDate";
  accounts: AccountMapping;
};

export type ShopifyTransactionRow = {
  "Transaction Date": string;
  Type: string;
  Order?: string;
  "Card Brand"?: string;
  "Card Source"?: string;
  "Payout Status"?: string;
  "Payout Date"?: string;
  "Available On"?: string;
  Amount?: string;
  Fee?: string;
  Net?: string;
  Checkout?: string;
  "Payment Method Name"?: string;
  "Presentment Amount"?: string;
  "Presentment Currency"?: string;
  Currency?: string;
  VAT?: string;
  [key: string]: unknown;
};

export type NormalizedEntry = {
  payoutDateYmd: string; // YYYYMMDD
  grossAmount: number; // Amount (incl VAT)
  vatAmount: number; // computed from gross via vatRate or CSV VAT if > 0
  feeAmount: number; // Fee as positive number
  netAmount: number; // Net (gross - fee), may not equal CSV Net if rounding differs
  orderId?: string; // Shopify order reference like #1082
};

export type AggregatedVoucher = {
  dateYmd: string;
  totalGross: number;
  totalVat: number;
  totalFees: number;
  totalNet: number;
  orderCount?: number;
  description?: string;
};
