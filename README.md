# Cutz website

Marketing site for the Cutz app, served at https://cutzapp.one.

- `index.html`: homepage
- `barbers.html`: barber signup, pricing, LAUNCH code, FAQ
- `privacy.html`: privacy policy (GDPR)
- `terms.html`: terms of service

Plain HTML/CSS/JS with no build step. Each page is self-contained except for the Inter font from Google Fonts.
Live data (barber count, LAUNCH availability) comes from Supabase's public `barbers_public` view and the
`check_referral_code` RPC, using the public anon key. The barber count stays hidden until 10 or more barbers are live.

Deployed automatically to GitHub Pages via `.github/workflows/deploy.yml` on every push to `main`.
`CNAME` points the Pages site at cutzapp.one.
