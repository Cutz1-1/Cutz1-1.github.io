# Cutz website

Marketing site and web booking for the Cutz app, served at https://cutzapp.one via GitHub Pages.

| Page | What it is |
|---|---|
| `index.html` | Homepage |
| `find.html` | Search and filter live barbers and salons |
| `map.html` | Leaflet/OpenStreetMap map of live barbers |
| `barber.html?id=` | Barber profile: book (service → time → details → email code), walk-in queue, waitlist, reviews |
| `salon.html?id=` | Salon profile and team |
| `barbers.html`, `salons.html` | For barbers / for salons, pricing, LAUNCH code; barbers.html has the early-access "Join as a barber" form |
| `mybookings.html` | Customer bookings: upcoming, past, waitlist; cancel and change time |
| `reset-password.html` | Request a reset email and set a new password |
| `download.html` | App Store download page ("in review" until Apple approves the app) |
| `about.html`, `blog.html`, `faq.html`, `contact.html` | Company pages |
| `privacy.html`, `terms.html` | Legal |
| `assets/site.css` | Shared design system (light theme, Inter, green #00dc64 for key CTAs only): tokens, nav, buttons, forms, cards, footer |
| `assets/site.js` | Shared behaviour: mobile menu, reveal on scroll, copy buttons, footer year, LAUNCH code status |
| `assets/img/` | Barbershop photos (Unsplash, free licence) and real app screenshots (`app-*.jpg`) |
| `assets/appstore.js` | App Store auto-switch, loaded in every page's `<head>` |
| `assets/cutz-auth.js` | Shared customer sign-in (email + 6-digit code, no password) for barber, mybookings and reset pages |
| `404.html` | Not-found page; also forwards the app's `/b/<id>` and `/s/<id>` share links |

Plain HTML/CSS/JS, no build step. Every page loads `assets/site.css` and `assets/site.js` and uses the same nav and
footer markup; page-specific layout stays in that page's own `<style>`. Live data comes from Supabase public views (`barbers_public`, `salons_public`,
`reviews`) with the public anon key; bookings go through the same RLS-protected `bookings` table as the app, so a
customer account is required. The App Store review account is hidden from listings.

Social images and icons are in `assets/`. `sitemap.xml` and `robots.txt` are for search engines.
Deployed automatically by `.github/workflows/deploy.yml` on every push to `main`. `CNAME` points Pages at cutzapp.one.

**App Store switch.** While the app is in review, store buttons say "Coming soon" and point to `download.html`.
`assets/appstore.js` asks Apple's public lookup API (`itunes.apple.com/lookup?id=6811618000`, JSONP) whether the
app is live and caches the answer in the visitor's browser (6 hours while not live, 7 days once live). When Apple
approves the app the site switches by itself: `<a data-store>` links go to the App Store, `[data-live-only]` text
shows and `[data-soon-only]` text hides. Nothing needs to change in the code on launch day.

## Customer sign-in

Customers never choose a password on the website. `assets/cutz-auth.js` emails a 6-digit code: new accounts get the
"Confirm signup" email, returning customers the "Magic Link" email (both templates contain `{{ .Token }}`; sources in
the app repo's `supabase/email-template*.html`). Customers who prefer a password can still use it, and set or reset it
on `reset-password.html`.

Free and taken times come from the `get_barber_busy_slots` RPC (times only, no customer data). Waitlist and barber
early-access emails are sent by the `site-hook` edge function (app repo, `supabase/functions/site-hook`).
