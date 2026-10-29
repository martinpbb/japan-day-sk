# Content model

Primary JSON ownership:
- `site.json`: event identity, hero, venue/practical information and shared copy.
- `program.json`: schedule entries and performer references.
- `performers.json`: performer bios, images, categories and slugs.
- `gastronomy.json`: food/drink content.
- `gallery.json`: gallery assets/captions.
- `partners.json`: partners/sponsors.
- `exhibitors.json`: exhibitors/vendors.
- `seo.json`: route-specific SEO metadata.

Do not duplicate performer biographies into program entries. Use IDs/slugs to join data. When changing an ID/slug, check all consumers and generated routes.
