---
applyTo:
  - "src/data/**/*.json"
  - "src/components/**/*.jsx"
---

# Event content and JSON instructions

The site stores event-oriented content in repository JSON files and renders it through React sections.

## Data changes

Before changing a JSON structure:

1. locate its consumers, using Graphify first when the relationship is cross-file and a graph exists;
2. preserve the current shape unless the task requires a schema change;
3. update every directly affected consumer;
4. verify rendered behavior.

Do not introduce duplicate sources of truth.

Prefer extending existing data structures over creating parallel content stores.

## Content ownership

- `site.json`: event identity, high-level site copy, date, venue, navigation, video, practical information.
- `seo.json`: canonical routes, page metadata, structured-data configuration, and semantic topic guidance.
- `program.json`: chronological schedule.
- `performers.json`: performer/speaker profiles.
- `gastronomy.json`: food and beverage content.
- `gallery.json`: gallery data.
- `partners.json`: organisers, patronage, sponsors, and partners.
- `exhibitors.json`: exhibitors and sellers.

Do not hard-code content into components when one of these files already owns it.

## Programme and performers

Keep schedule-specific information separate from biographies.

Prefer stable IDs such as `performerId` to connect programme items to performer profiles.

Do not silently rename or remove IDs used by consumers.

## Accuracy

Never invent missing event times, biographies, prices, organisations, sponsor status, locations, or logistical claims.

If information is not yet confirmed, preserve the project's placeholder convention rather than guessing.
