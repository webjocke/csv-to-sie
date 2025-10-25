"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { useEffect, useMemo, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Settings } from "@/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const schema = z.object({
  companyName: z.string().min(1),
  orgNumber: z.string().min(6),
  fiscalYearStart: z.string().regex(/^(\d{8}|\d{4}-\d{2}-\d{2})$/, {
    message: "Ange datum som YYYYMMDD eller YYYY-MM-DD",
  }),
  fiscalYearEnd: z.string().regex(/^(\d{8}|\d{4}-\d{2}-\d{2})$/, {
    message: "Ange datum som YYYYMMDD eller YYYY-MM-DD",
  }),
  authorName: z.string().optional(),
  voucherSeries: z.preprocess(
    (v) =>
      typeof v === "string"
        ? v.trim() === ""
          ? "A"
          : v
        : (v as string) ?? "A",
    z.string().min(1)
  ),
  vatRatePercent: z.coerce.number().min(0),
  grouping: z.enum(["perOrder", "payoutDate", "singleVoucher"]),
  accounts: z.object({
    bankAccount: z.string().min(3),
    salesAccount: z.string().min(3),
    outputVatAccount: z.string().min(3),
    feesAccount: z.string().min(3),
    inputVatAccount: z.string().optional(),
  }),
});

export type SettingsFormData = z.infer<typeof schema>;

type Props = {
  value: Settings;
  onChange: (v: Settings) => void;
};

export function SettingsForm({ value, onChange }: Props) {
  // defaultValues are applied only on first render; subsequent parent updates won't reset fields
  const form = useForm<SettingsFormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: value,
    mode: "onChange",
    shouldFocusError: false,
  });

  // Sync changes outward without re-submitting or resetting the form
  const suppressOnChangeRef = useRef(true);
  useEffect(() => {
    const subscription = form.watch((data) => {
      if (suppressOnChangeRef.current) return;
      const d = data as Settings;
      const normalizeYmd = (s: string) =>
        s?.includes("-") ? s.replaceAll("-", "") : s;
      const next: Settings = {
        ...d,
        sieType: 4,
        authorName: "ShopifyFortnoxConverter",
        fiscalYearStart: normalizeYmd(d.fiscalYearStart),
        fiscalYearEnd: normalizeYmd(d.fiscalYearEnd),
        vatRatePercent: Number(d.vatRatePercent) || 0,
        voucherSeries: d.voucherSeries || "A",
        accounts: {
          bankAccount: d.accounts.bankAccount || "1930",
          salesAccount: d.accounts.salesAccount || "3001",
          outputVatAccount: d.accounts.outputVatAccount || "2611",
          feesAccount: d.accounts.feesAccount || "6570",
        },
      };
      if (areSettingsEqual(next, value)) return;
      onChange(next);
    });
    return () => subscription.unsubscribe();
  }, [form.watch, onChange]);

  // One-time hydration from persisted values, then let RHF own the state
  const hydratedRef = useRef(false);
  useEffect(() => {
    if (hydratedRef.current) return;
    form.reset(value as any);
    const id = setTimeout(() => {
      suppressOnChangeRef.current = false;
      hydratedRef.current = true;
    }, 0);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  function areSettingsEqual(a: Settings, b: Settings) {
    if (
      a.companyName !== b.companyName ||
      a.orgNumber !== b.orgNumber ||
      a.fiscalYearStart !== b.fiscalYearStart ||
      a.fiscalYearEnd !== b.fiscalYearEnd ||
      a.authorName !== b.authorName ||
      a.sieType !== b.sieType ||
      a.voucherSeries !== b.voucherSeries ||
      a.vatRatePercent !== b.vatRatePercent ||
      a.grouping !== b.grouping
    )
      return false;
    const aa = a.accounts;
    const bb = b.accounts;
    return (
      aa.bankAccount === bb.bankAccount &&
      aa.salesAccount === bb.salesAccount &&
      aa.outputVatAccount === bb.outputVatAccount &&
      aa.feesAccount === bb.feesAccount &&
      (aa.inputVatAccount || "") === (bb.inputVatAccount || "")
    );
  }

  const [showAdvanced, setShowAdvanced] = useState(false);

  const currentYear = new Date().getFullYear();
  const yearOptions = useMemo(() => {
    return Array.from({ length: 11 }).map((_, i) => String(currentYear - i));
  }, [currentYear]);

  const [fyPreset, setFyPreset] = useState<string>(() => {
    try {
      const yStart = value.fiscalYearStart.slice(0, 4);
      const yEnd = value.fiscalYearEnd.slice(0, 4);
      if (
        value.fiscalYearStart.endsWith("0101") &&
        value.fiscalYearEnd.endsWith("1231") &&
        yStart === yEnd
      ) {
        return yStart;
      }
    } catch {}
    return "custom";
  });

  function handleYearPresetChange(val: string) {
    setFyPreset(val);
    if (val !== "custom") {
      const y = val;
      form.setValue("fiscalYearStart", `${y}0101`, {
        shouldValidate: true,
        shouldDirty: true,
      });
      form.setValue("fiscalYearEnd", `${y}1231`, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  }

  return (
    <Form {...form}>
      <form className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_1fr_min-content]">
        <FormField
          control={form.control}
          name="companyName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Företagsnamn*</FormLabel>
              <FormControl>
                <Input placeholder="ACME AB" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="orgNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Organisationsnummer*</FormLabel>
              <FormControl>
                <Input placeholder="556677-8899" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* Räkenskapsår moved to Advanced options */}
        <FormField
          control={form.control}
          name="voucherSeries"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Verifikationsserie</FormLabel>
              <Select
                value={field.value as string}
                onValueChange={field.onChange}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Välj serie" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="A">A - Redovisning (vanligast)</SelectItem>
                  <SelectItem value="B">B - Kundfakturor</SelectItem>
                  <SelectItem value="C">
                    C - Inbetalningar från kunder
                  </SelectItem>
                  <SelectItem value="D">D - Leverantörsfakturor</SelectItem>
                  <SelectItem value="E">
                    E - Utbetalningar till leverantörer
                  </SelectItem>
                  <SelectItem value="F">F - Kassa</SelectItem>
                  <SelectItem value="G">G - Avskrivning</SelectItem>
                  <SelectItem value="H">H - Periodisering</SelectItem>
                  <SelectItem value="I">I - Bokslut</SelectItem>
                  <SelectItem value="J">J - Revisor</SelectItem>
                  <SelectItem value="K">K - Lön</SelectItem>
                  <SelectItem value="L">L - Kontantfaktura</SelectItem>
                  <SelectItem value="M">M - Momsrapport</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="col-span-1 md:col-span-3 flex justify-end">
          <button
            type="button"
            aria-expanded={showAdvanced}
            aria-controls="advanced-panel"
            onClick={() => setShowAdvanced((s) => !s)}
            className="flex items-center gap-2 text-sm font-medium hover:opacity-80"
          >
            <span>Avancerade alternativ</span>
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform",
                showAdvanced ? "rotate-180" : "rotate-0"
              )}
            />
          </button>
        </div>
        {showAdvanced && (
          <div
            id="advanced-panel"
            className="col-span-1 md:col-span-3 rounded-lg bg-zinc-50 dark:bg-zinc-900/40 p-3"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormItem>
                <FormLabel>Räkenskapsår</FormLabel>
                <Select value={fyPreset} onValueChange={handleYearPresetChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Välj år" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {yearOptions.map((y) => (
                      <SelectItem key={y} value={y}>
                        {y}
                      </SelectItem>
                    ))}
                    <SelectItem value="custom">Anpassat…</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
              {fyPreset === "custom" && (
                <>
                  <FormField
                    control={form.control}
                    name="fiscalYearStart"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start (YYYYMMDD)</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="fiscalYearEnd"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Slut (YYYYMMDD)</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
              <FormField
                control={form.control}
                name="vatRatePercent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Moms %</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="25"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="accounts.bankAccount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bankkonto</FormLabel>
                    <FormControl>
                      <Input placeholder="1930" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="accounts.feesAccount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Avgifter konto</FormLabel>
                    <FormControl>
                      <Input placeholder="6570" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="accounts.salesAccount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Försäljning konto</FormLabel>
                    <FormControl>
                      <Input placeholder="3001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="accounts.outputVatAccount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Utgående moms konto</FormLabel>
                    <FormControl>
                      <Input placeholder="2611" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="grouping"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gruppering</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Välj gruppering" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="perOrder">
                          En verifikation per order
                        </SelectItem>
                        <SelectItem value="payoutDate">
                          Sammanfoga per utbetalningsdatum
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        )}
      </form>
    </Form>
  );
}
