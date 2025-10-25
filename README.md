## CSV → SIE (Shopify Payments to Fortnox)

Convert a Shopify Payments transactions export (CSV) into a Fortnox‑compatible SIE file (type 4). Runs fully in your browser. No data leaves your machine. Nothing is saved in the cloud.

See it in action at [csv-till-sie.joakimjohansson.se](https://csv-till-sie.joakimjohansson.se)

Created by [Joakim Johansson](https://joakimjohansson.se).

### What it does

- **Drag & drop CSV**: Paste or drop your Shopify Payments CSV.
- **Preview vouchers**: See the verifications that will be created.
- **Flexible grouping**: Per order or aggregated per payout date.
- **VAT handling**: Uses VAT from CSV when present, or recomputes from a chosen rate.
- **Custom chart of accounts**: Configure bank, fees, sales, and output VAT accounts.
- **Downloads SIE v4**: Encoded as PC8 (Windows‑1252), ready to import to Fortnox.

A minimal example of the generated SIE header:

```text
#FLAGGA 0
#PROGRAM "ShopifyFortnoxConverter" "v0.1"
#FORMAT PC8
#SIETYP 4
#FNAMN "<Company>"
#ORGNR <OrgNr>
```

### How to use

1. Export a Shopify Payments transactions CSV from Shopify Admin.
2. Start the app locally (see Development) or open your deployed URL.
3. Fill in settings (company, org.nr, fiscal year, voucher series, accounts, VAT rate).
4. Drop the CSV file into the app. Review the preview and totals.
5. Click “Skapa SIE fil” to download a `.sie` file and import it into Fortnox.

Notes

- Settings are stored in `localStorage` under `sie-settings` for convenience.
- The app detects a header containing: `Transaction Date`, `Type`, `Payout Date`, `Amount`, `Fee`, `Net` (and optionally `VAT`).
- When CSV VAT is 0 or missing, VAT is recomputed from your configured VAT rate.
- Rounding is to 2 decimals.

### Accounting logic (per voucher)

Each voucher contains four transactions (default account numbers are editable):

- Debit `1930` bank with total net inflow
- Debit `6570` fees with total fees
- Credit `3001` sales with sales excl. VAT
- Credit `2611` output VAT with VAT amount

Voucher series defaults to `A`. SIE type is 4.

### Sample data

- Example CSV: `shopify-payments.csv`
- Example outputs: `shopify-payments.csv.sie`, `shopify-payments.csv(1).sie`, etc.

## Development

### Requirements

- Node.js 18+ recommended

### Install and run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

### Scripts

- `npm run dev`: Start Next.js dev server
- `npm run build`: Production build
- `npm run start`: Start built app
- `npm run lint`: Run ESLint
- `npm run deploy`: Build and deploy to Cloudflare (see below)

### Relevant files

- UI and flow: `app/page.tsx`, `components/Dropzone.tsx`, `components/SiePreview.tsx`, `components/SettingsForm.tsx`
- CSV parsing and aggregation: `lib/csv.ts`
- SIE generation: `lib/sie.ts`
- Types: `types/index.ts`

## Deployment (Cloudflare Workers via OpenNext)

This app is configured to deploy to Cloudflare Workers using OpenNext.

Files of interest: `opennext.config.ts`, `wrangler.toml`.

Deploy:

```bash
npm run deploy
```

Make sure your `wrangler.toml` is configured with your Cloudflare account details and that you are authenticated with `wrangler`.

## Tech stack

- Next.js 16 (App Router), React 19, TypeScript
- Tailwind CSS 4, Radix UI primitives
- PapaParse, React Hook Form, Zod, Sonner
- OpenNext + Cloudflare Wrangler for deployment

## Privacy

All parsing and SIE generation happen in the browser. No files are uploaded.

## License

MIT license.
