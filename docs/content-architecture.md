# Content architecture

The project is intentionally JSON-driven. Editorial and SEO content should not be duplicated inside React components when an existing data file owns it.

## Data ownership

- `src/data/site.json` — brand, event facts, venue, navigation, homepage copy, video, practical information, FAQ and contact placeholders.
- `src/data/seo.json` — canonical public routes, titles, descriptions, H1 copy, social metadata configuration and semantic topic guidance.
- `src/data/program.json` — chronological programme entries.
- `src/data/performers.json` — performer and guest profiles.
- `src/data/gastronomy.json` — food and beverage content.
- `src/data/exhibitors.json` — exhibitors and sellers.
- `src/data/gallery.json` — gallery photographs and alt text.
- `src/data/partners.json` — organisers, patronage, sponsors and partners.

## Programme ↔ performers

Programme entries intentionally do not contain long biographies. A programme item may contain `performerId`, which references a performer record in `performers.json`.

Benefits:

- changing a performance time edits only `program.json`;
- changing a biography edits only `performers.json`;
- one performer can appear multiple times in the programme;
- images and biographies are not hard-coded in React.

The current programme is a working draft based on confirmed information available so far. Before publication, compare all times with the final schedule.

## SEO routes

Public route metadata is centralized in `seo.json`. The React application renders route-specific views, and the post-build SEO generator writes static route HTML documents to `dist/<route>/index.html`.

When a new public route is added:

1. add the route to `seo.json`;
2. add or reuse the corresponding React view;
3. decide which structured-data blocks apply;
4. ensure the route appears in the generated sitemap if indexable;
5. verify its canonical and Open Graph metadata after build.
