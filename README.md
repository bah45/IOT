# Energy-Aware Self-Powered Predictive Maintenance Dashboard

Web dashboard for the ESP32-C3 / LTC3588-1 / ADXL335 / ACS712 predictive-maintenance
node. React + TypeScript + Vite + Tailwind + Recharts on the frontend, Supabase
(Postgres + Realtime + Edge Functions) as the backend, Wokwi for hardware simulation.

## Pages
- **Overview** — headline metrics, ISO 10816 zone, root-cause diagnostic
- **Live Telemetry** — sub-second stream + raw packet table
- **Alerts** — filterable fault log with acknowledge workflow
- **Analytics** — 6 correlated charts (vibration, anomaly, energy, load correlation, health radar, power budget)
- **Reliability** — MTBF-style estimate, energy autonomy, maintenance recommendation
- **History** — date-range query, multi-metric chart, paginated table, CSV export, stats
- **Configuration** — thresholds, registered SMS number, hardware simulator buttons

Plus a floating **VibeBot** assistant (rule-based, reads live telemetry/alerts) and
an SMS pipeline that fires on critical faults **and** on connection loss.

## 1. Supabase setup
1. Create a project at supabase.com and open **SQL Editor**.
2. Run the entire contents of `supabase/schema.sql`. This creates `telemetry`,
   `alerts`, `node_config`, enables Realtime, RLS policies, and the ISO/Z-score
   anomaly trigger.
3. Deploy the SMS function (needs the Supabase CLI):
   ```bash
   supabase login
   supabase link --project-ref YOUR-PROJECT-REF
   supabase functions deploy send-sms
   supabase secrets set TWILIO_ACCOUNT_SID=xxxx TWILIO_AUTH_TOKEN=xxxx TWILIO_PHONE_NUMBER=+1xxxxxxxxxx
   ```
   (Get these from a free Twilio trial account at twilio.com.) Without this step
   the app still runs — SMS calls will just fail silently and log to console.

## 2. Frontend setup
```bash
npm install
cp .env.example .env      # then fill in your Supabase URL + anon key
npm run dev
```
Open the printed local URL. The Configuration page has "Simulate Zone D emergency
spike" / "Simulate low-energy warning" buttons to test the whole pipeline
(insert → SQL trigger → alert row → Realtime → UI → siren → SMS) with zero hardware.

## 3. Deploy the frontend
Any static host works (Vercel, Netlify, Cloudflare Pages):
```bash
npm run build      # outputs to dist/
```
Push to GitHub and import into Vercel/Netlify, or drag-and-drop `dist/` into
Netlify's manual deploy. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
as environment variables on the host — the same values from your `.env`.

## 4. Hardware — simulate first, then flash real hardware
**Simulate (no hardware needed):**
1. Go to wokwi.com → new ESP32-C3 project.
2. Replace `diagram.json`, `libraries.txt`, `sketch.ino` with the files in `/hardware`.
3. In `sketch.ino`, set `SUPABASE_URL` (ends in `/rest/v1/telemetry`) and
   `SUPABASE_KEY` (your anon public key).
4. Press Play. Rows should appear in Supabase's `telemetry` table within ~3s,
   and the dashboard updates live over the Realtime WebSocket.

**Real hardware:** same `sketch.ino` runs on a physical ESP32-C3 in the Arduino
IDE — swap `Wokwi-GUEST` for your real Wi-Fi credentials, and replace the
MPU6050/potentiometer reads with your actual ADXL335 analog reads and
ACS712/SCT-013 current reads (see the pin comments in the file).

## Notes on data flow
```
ESP32-C3 (or Wokwi) --HTTPS POST--> Supabase telemetry table
                                       │
                                       ├─ SQL trigger checks ISO Zone D / Z-score / kurtosis / low voltage
                                       │     └─ inserts into alerts table if breached
                                       │
                                       └─ Realtime (WebSockets) ──> React dashboard
                                                                      ├─ charts update
                                                                      ├─ critical alert → siren + drawer + SMS
                                                                      └─ connection-loss heartbeat → SMS
```

## Security note
`supabase/schema.sql` uses fully public RLS policies so the ESP32's anon key can
insert without an auth flow — fine for a hackathon/demo. Before exposing this
publicly, restrict `INSERT` to a service-role key on the device side, or add a
lightweight shared-secret check (e.g. an `x-api-key` header validated in an
Edge Function that proxies the insert) instead of a public insert policy.
