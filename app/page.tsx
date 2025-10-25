"use client";
import { useMemo, useState } from "react";
import { Dropzone } from "@/components/Dropzone";
import { CsvPreview } from "@/components/CsvPreview";
import { formatAmount, SiePreview } from "@/components/SiePreview";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { SettingsForm } from "@/components/SettingsForm";
import {
  aggregateByPayoutDate,
  isShopifyTransactionsHeader,
  maybeApplyVatRate,
  parseTransactionsCsv,
  perOrderVouchers,
} from "@/lib/csv";
import { buildSieFile } from "@/lib/sie";
import { Settings } from "@/types";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

export default function Home() {
  const [csvText, setCsvText] = useState<string>("");
  const [csvName, setCsvName] = useState<string>("");
  const [progress, setProgress] = useState<number>(0);

  const year = new Date().getFullYear();

  const thing =
    typeof window !== "undefined"
      ? window.localStorage.getItem("sie-settings")
      : null;
  const settingsRaw = thing ? JSON.parse(thing) : null;
  const [settings, setSettingsReal] = useState<Settings>(
    settingsRaw
      ? settingsRaw
      : {
          companyName: "",
          orgNumber: "",
          fiscalYearStart: `${year}0101`,
          fiscalYearEnd: `${year}1231`,
          authorName: "ShopifyFortnoxConverter",
          sieType: 4,
          voucherSeries: "A",
          vatRatePercent: 25,
          grouping: "perOrder",
          accounts: {
            bankAccount: "1930",
            salesAccount: "3001",
            outputVatAccount: "2611",
            feesAccount: "6570",
          },
        }
  );
  const setSettings = (settings: Settings) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("sie-settings", JSON.stringify(settings));
    }
    setSettingsReal(settings);
  };

  const parsed = useMemo(() => {
    if (!csvText) return { rows: [], normalized: [], aggregated: [] as any[] };
    const result = parseCsvForPreview(csvText);
    const normalizedBase = parseTransactionsCsv(csvText);
    const normalized = maybeApplyVatRate(
      normalizedBase,
      settings.vatRatePercent
    );
    const aggregated =
      settings.grouping === "perOrder"
        ? perOrderVouchers(normalized)
        : aggregateByPayoutDate(normalized);
    return { rows: result.rows, normalized, aggregated };
  }, [
    csvText,
    settings.vatRatePercent,
    settings.grouping,
    settings.voucherSeries,
  ]);

  function onFile(text: string, name: string) {
    setCsvText(text);
    setCsvName(name);
  }

  async function onGenerate() {
    try {
      setProgress(10);
      await new Promise((r) => setTimeout(r, 150));
      setProgress(40);
      const sie = buildSieFile(parsed.aggregated, settings);
      setProgress(80);
      const blob = new Blob([sie], { type: "text/plain;charset=windows-1252" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = (csvName || "export") + ".sie";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setProgress(100);
      toast.success("SIE genererad. Nerladdning startade.");
      setTimeout(() => setProgress(0), 400);
    } catch (e) {
      toast.error("Kunde inte generera SIE");
    }
  }

  const canGenerate = Boolean(
    csvText &&
      settings.companyName &&
      settings.orgNumber &&
      settings.voucherSeries &&
      settings.fiscalYearStart &&
      settings.fiscalYearEnd
  );

  const totals = parsed.aggregated.reduce(
    (acc, v) => {
      acc.orders += v.orderCount ?? 1;
      acc.amount += v.totalGross;
      return acc;
    },
    { orders: 0, amount: 0 }
  );

  return (
    <div className="container mx-auto p-1 space-y-6">
      <Toaster />
      <Card className="bg-transparent border-0 shadow-none rounded-none">
        <CardHeader>
          <CardTitle>Shopify CSV → Fortnox SIE Import file</CardTitle>
          <CardDescription>
            Konvertera din Shopify Payments-export till en SIE-fil för import i
            Fortnox.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <SettingsForm value={settings} onChange={setSettings} />
          <div className="space-y-4">
            {parsed.aggregated.length === 0 ? (
              <Dropzone onText={onFile} />
            ) : (
              <Dropzone onText={onFile}>
                {(openFile) => (
                  <div className="text-left pt-6 pb-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-xl font-semibold">
                        Förhandsvisning av verifikat som kommer importeras in i
                        Fortnox.
                      </div>
                      <Button variant="outline" size="sm" onClick={openFile}>
                        Välj en ny fil
                      </Button>
                    </div>
                    <SiePreview
                      vouchers={parsed.aggregated as any}
                      settings={settings}
                    />

                    <div className="pt-3 text-sm">
                      <div>
                        <span className="font-medium">
                          Totalt antal beställningar:
                        </span>{" "}
                        {totals.orders}
                      </div>
                      <div>
                        <span className="font-medium">
                          Total försäljning inkl. moms:
                        </span>{" "}
                        {formatAmount(totals.amount)}
                      </div>
                    </div>
                  </div>
                )}
              </Dropzone>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button disabled={!canGenerate} onClick={onGenerate}>
              Skapa SIE fil
            </Button>
            {progress > 0 && <Progress className="h-2 w-48" value={progress} />}
          </div>
          <div className="text-sm text-muted-foreground">
            Skapad av{" "}
            <a
              href="https://joakimjohansson.se"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-600"
            >
              Joakim Johansson
            </a>{" "}
            med källkod tillgänglig på{" "}
            <a
              href="https://github.com/webjocke/csv-to-sie"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-600"
            >
              GitHub
            </a>
            .
          </div>
        </CardContent>
      </Card>
      {/* No separate preview below anymore; included inside main card's dropzone */}
    </div>
  );
}

function parseCsvForPreview(text: string) {
  const [firstLine, ...rest] = text.split(/\r?\n/);
  const header = firstLine?.split(",").map((s) => s.trim()) ?? [];
  const isTx = isShopifyTransactionsHeader(header);
  const rows = rest
    .filter(Boolean)
    .slice(0, 200)
    .map((line) => line.split(","))
    .map((cols) =>
      Object.fromEntries(header.map((h, i) => [h, cols[i] ?? ""]))
    );
  return { isTx, rows };
}
