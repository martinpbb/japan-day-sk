# Japanday.sk — approved post-event homepage V5 reference

This folder contains the visual concept agreed with the site owner.
It is an implementation REFERENCE, not a production-ready webpage.

## Reference priority

1. `reference.html` — authoritative overall section order, layout/composition, sample Slovak wording and updated form fields.
2. `hero-original-artwork.png` — the original POVAŽSKÁ BYSTRICA artwork within the V4 hero composition (a screenshot reference ONLY). In production reuse the ORIGINAL React/CSS implementation in `src/components/Hero.jsx`, NOT the image embedded in the prototype or a crop of this screenshot.
3. `layout-desktop.png`, `layout-mobile.png` — full-page visual references from the preceding version with the same preferred section layout; they may differ in details subsequently incorporated into V5. When they conflict, prefer `reference.html` and the signed-off V5 requirements.
4. `feedback-gastronomy.png`, `newsletter-desktop.png`, `newsletter-mobile.png` — updated V5 feedback and voluntary newsletter signup detail.

## Approved composition

Preserve the original V1/V3 section layout, and current japanday.sk header/menu visual identity and color palette: cream navigation, deep green hero/background accents, muted red, elegant serif headlines, rounded cards, generous spacing. Keep original brand/artwork rather than using screenshots for production.

Homepage section order:
1. Thank-you hero — 'Jeden deň. Tisíc zážitkov. Ďakujeme.'
2. Anonymous visitor feedback
3. Children's contest results (placeholders until evidence supplied)
4. Photos and video (placeholders until actual event assets supplied)
5. Future plans (do not invent dates or commitments)
6. Acknowledgements (existing verified partners/supporters)
7. Archive 2026 link

A SEPARATE optional newsletter signup card should be placed near the feedback section without changing the seven-section content order. Name optional; email and explicit unselected consent are required to subscribe. Anonymous feedback never requires email, name, or newsletter consent.

Feedback questions include rating 1–5, highlights, improvement suggestions, future wishes, favorite food/drink, missing gastronomic options, and an additional message.

## Implementation rules

- Treat prototype JavaScript and forms as NONFUNCTIONAL placeholders. Do not copy frontend-only fake submissions into production. Never claim any response was sent or saved until a real endpoint is approved and implemented.
- Keep the 2026 archive, localized links, and existing SSG/SEO routing functional across SK, EN, DE, ES, JA.
- Keep past workshop registrations CLOSED in the archive; do not modify D1 or production API Worker.
- Do not introduce event photos, winners, confirmed plans, or publishing dates without provided material.
- No deploy, DNS changes, push, or main merge without owner approval.
- The static HTML prototype exists under docs/ as reference; do not import it into React or copy it as a replacement for existing components.
