---
name: Trilingual font requirement (uz/ru/en)
description: Any font used in Bazm must ship a Cyrillic subset, or Russian text silently falls back to a system font.
---

# Fonts must cover Cyrillic + Latin-Extended

Bazm is trilingual: Uzbek Latin, Russian (Cyrillic), English. Uzbek uses the
plain ASCII apostrophe (U+0027, e.g. `to'y`), so no exotic glyph is needed — but
**Russian requires a Cyrillic subset**.

**Rule:** before choosing any Google Font for this app, confirm it serves a
`cyrillic` subset. Verify by fetching the css2 URL per-family and checking for a
`/* cyrillic */` block / `unicode-range: U+04...`.

**Why:** Plus Jakarta Sans (a previous body font) has NO Cyrillic subset, so
Russian body text silently rendered in a mismatched system fallback. Playfair
Display (headings) and Nunito Sans (body) both ship cyrillic + cyrillic-ext and
are the current pairing.

**How to apply:** load fonts via `<link>` in index.html (not a CSS `@import`,
which triggers the "@import must precede all statements" warning after the
tailwind import). Test explicitly by temporarily defaulting the locale cookie to
`ru` and screenshotting, then revert.
