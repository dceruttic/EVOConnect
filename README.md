# REVAI × STAAR — Demo environment

Static deployment of two surfaces of the EVO Connect platform:

- **`/dashboard`** — EVO Connect (clinic-facing): per-patient workflow, pre-op → ICL selection → surgical planner → surgery → post-op + Phase Demo Mode
- **`/intelligence`** — STAAR Intelligence Center (HQ-facing): clinical analytics, operations pulse, supply chain, AI agents

## Local preview

```bash
npx serve .
# or
python3 -m http.server 8080
```

Then open http://localhost:8080

## Deploy

Pushed to GitHub → auto-deployed via Vercel. No build step; static HTML/CSS/JS only.

`vercel.json` rewrites `/dashboard/assets/*` and `/intelligence/assets/*` to `/assets/*` so each app's relative asset paths resolve to the shared assets folder.

## Notes

- All clinical data is mocked. No real PHI.
- Built as a single-file HTML app per surface (no build pipeline).
