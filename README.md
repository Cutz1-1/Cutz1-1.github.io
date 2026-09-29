# Cutz website

Marketing site and web booking for the Cutz app, served at https://cutzapp.one via GitHub Pages.

| Page | What it is |
|---|---|
| `index.html` | Homepage |
| `find.html` | Search and filter live barbers and salons |
| `map.html` | Leaflet/OpenStreetMap map of live barbers |
| `barber.html?id=` | Barber profile with the web booking flow |
| `salon.html?id=` | Salon profile and team |
| `barbers.html`, `salons.html` | For barbers / for salons, pricing, LAUNCH code |
| `download.html` | App Store download with QR code |
| `about.html`, `blog.html`, `faq.html`, `contact.html` | Company pages |
| `privacy.html`, `terms.html` | Legal |
| `404.html` | Not-found page; also forwards the app's `/b/<id>` and `/s/<id>` share links |

Plain HTML/CSS/JS, no build step. Live data comes from Supabase public views (`barbers_public`, `salons_public`,
`reviews`) with the public anon key; bookings go through the same RLS-protected `bookings` table as the app, so a
customer account is required. The App Store review account is hidden from listings.

Social images and icons are in `assets/`. `sitemap.xml` and `robots.txt` are for search engines.
Deployed automatically by `.github/workflows/deploy.yml` on every push to `main`. `CNAME` points Pages at cutzapp.one.
