# Changelog

## v1.5.1 — 2026-11-27
- Support six-digit numeric administrator PIN from server-only environment variable; longer passwords still supported.
- Added best-effort per-instance login throttling (5 attempts per 15 minutes), not a shared rate limit.
- No changes to cat animation pending user review.

## v1.5.0 — 2026-11-27
- Added a visible administrator link and password login with signed, HttpOnly session cookie.
- Admin writes now use a Vercel server function and GitHub credential stored in server environment variables; browser never receives GitHub token.
- Removed public URL code as authentication; previous admin links open login. Requires environment setup before use.
- All 40 restaurant candidates and probability values preserved.

## v1.4.2 — 2026-11-27
- Added Poram, confirmed Leo Pub; 40 restaurants.

## v1.4.1 — 2026-11-27
- Added Tanpopo, Sinjeon, Yeopdduk and Leo Pub (pizza candidate).
- Removed Park Jihye sundae soup and Unbanmi (incorrect match).
- Total 39 candidates; new Vietnamese restaurant beside Budaeok remains unidentified. Pizza shop identity needs confirmation.
- Existing weights and probability settings unchanged.

## v1.4.0 — 2026-11-27
- Curated 37 restaurant candidates around the Inha University back gate, using the earlier shortlist and user additions.
- Removed Inhabanjum and Inhagak; added Jeokseongru, Tanghuakunfu and Bobaebanjum.
- Existing retained priorities and probability settings unchanged; new candidates use priority 2.
- Uncertain restaurant identities and exact walking distances require confirmation.

## v1.3.0 — 2026-11-27
- Vercel Web Analytics tracking script for public visits on Vercel domains; excludes admin URLs and GitHub Pages.
- Added visible site version. Vercel deployment and dashboard Analytics activation still required.

## v1.2.0 — 2026-11-27
- Shared configuration for restaurant lists, weights and roulette/cat probabilities.
- GitHub-authorized publishing from admin screen.

## v1.1.0 — 2026-11-27
- Expanded from 16 to 43 restaurant candidates; new candidates require verification.

## v1.0.0
- Original static lunch picker with browser-local settings.

Versions before v1.3.0 are retrospective labels for the existing commit history.
