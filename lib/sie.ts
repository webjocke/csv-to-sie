import { AggregatedVoucher, Settings } from "@/types";

const todayYmd = () => {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}${m}${day}`;
};

export function buildSieFile(
  vouchers: AggregatedVoucher[],
  settings: Settings
) {
  const header = [
    `#FLAGGA 0`,
    `#PROGRAM "Shopify→Fortnox SIE" "v0.1"`,
    `#FORMAT PC8`,
    `#GEN ${todayYmd()} "${escapeSie(
      settings.authorName || "ShopifyFortnoxConverter"
    )}"`,
    `#SIETYP 4`,
    `#FNAMN "${escapeSie(settings.companyName)}"`,
    `#ORGNR ${escapeSie(settings.orgNumber)}`,
    `#RAR 0 ${settings.fiscalYearStart} ${settings.fiscalYearEnd}`,
  ].join("\n");

  let verNum = 1;
  const series = settings.voucherSeries;

  const body = vouchers
    .map((v) => {
      const debitBank = round2(v.totalNet);
      const debitFees = round2(v.totalFees);
      const creditSalesExVat = round2(v.totalGross - v.totalVat);
      const creditVat = round2(v.totalVat);

      const description = v.description ?? "Shopify försäljning";
      const lines = [
        `#VER "${series}" ${verNum++} ${v.dateYmd} "${escapeSie(description)}"`,
        `{`,
        `    #TRANS ${settings.accounts.bankAccount} {} ${debitBank} "${v.dateYmd}" "Bank"`,
        `    #TRANS ${settings.accounts.feesAccount} {} ${debitFees} "${v.dateYmd}" "Avgifter"`,
        `    #TRANS ${settings.accounts.salesAccount} {} -${creditSalesExVat} "${v.dateYmd}" "Försäljning"`,
        `    #TRANS ${settings.accounts.outputVatAccount} {} -${creditVat} "${v.dateYmd}" "Utgående moms"`,
        `}`,
      ];
      return lines.join("\n");
    })
    .join("\n");

  return `${header}\n${body}\n`;
}

export function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function escapeSie(s: string) {
  return s.replaceAll('"', "'");
}
