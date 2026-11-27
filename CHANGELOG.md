# Changelog

## v2.5.1 — 2026-11-27
- Warm gray-brown mackerel coat instead of cool gray.
- Tuxedo coat has black legs and reduced ivory chest and muzzle patches, matching approved color direction.
- Original 16-frame silhouettes and timing preserved; no probability or other event changes.

## v2.5.0 — 2026-11-27
- Jackpot reels stop individually from top to bottom, with an ascending chime at each lock and fanfare only after the final match.
- Revised three coat sprites with unstriped tuxedo and patch-based calico, and cooler tabby markings; original 16-frame motion retained.
- Preview uses the same lock sequence. No probability or room configuration changes.

## v2.4.0 — 2026-11-27
- Added shared casino-inspired jackpot buildup: five rising original synthesized chimes, sequential gold slot lights, synchronized reels, gold marquee and celebratory burst.
- Added browser-local sound toggle; audio unlocks on user interaction, and unavailable audio never blocks the draw. Reduced-motion fallback included.
- Jackpot still requires 3+ slots, probability unchanged. Preview and live draw share the same effects module.

## v2.3.1 — 2026-11-27
- Hamster moves strictly top-to-bottom along one fixed vertical lane, with no sideways drift during skips, running, or exit.
- Non-target slots retain jump/drop animation and unchanged results. No probability or data changes.

## v2.3.0 — 2026-11-27
- Four separately rendered 16-frame coat sprites: original ginger, mackerel tabby, charcoal tuxedo with white markings, calico patches. Exact original motion and silhouette retained; no runtime recoloring.
- Smaller hamster enters from above and visits slots in order. Runs only on randomly selected slots, jumps past the others, exits below. Preserves unique results; no reroll when no unused restaurants exist.
- Five-slot event preview demonstrates selective reroll on slots 2 and 4. Existing probabilities, jackpot rule and room data unchanged.

## v2.2.0 — 2026-11-27
- Added hamster treadmill reroll (default 3%) and jackpot (default 1%, only 3+ slots, all slots match).
- Mutually exclusive events; normalize if eligible event probabilities exceed 100%. Cat probability and watch settings retained; four color variants reuse same motion.
- Room settings support new chances; old room/history data receives defaults for missing keys. Normal and hamster draws remain unique.
- Added event-preview.html for manual testing.

## v2.1.0 — 2026-11-27
- Replaced geometric cat animation with the approved 16-frame pixel-art kitten sprite, transparent background, walk/peek/paw strike/exit animation.
- Synchronized actual reroll with the strike; preserved cat probabilities and room settings. Original CSS cat remains a fallback if sprite fails.
- Added separate cat-preview.html for testing without changing probabilities.

## v2.0.0 — 2026-11-27
- Public read-only picker plus isolated invite-code rooms, per-room PIN sessions, Redis-backed settings, shared rate limits and last 20 versions with restore.
- Server validates length, allowed characters, links, HTML, duplicate names and priority/probability bounds.
- Existing 40 restaurant default and roulette/cat retained. Room features require Redis setup. No global web admin writes; no GitHub token required.

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
