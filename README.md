# Japan Day Považská Bystrica 2026

Web pre 3. ročník Japonského dňa čaju a kultúry v Považskej Bystrici.

- Dátum: 7. 11. 2026
- Miesto: Dom kultúry, Považská Bystrica
- Vstup: zdarma
- Hlavný jazyk: slovenčina
- Preklady: angličtina, nemčina, španielčina, zjednodušená čínština, vietnamčina
- Doména: https://japanday.sk

## Spustenie

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

Build vytvorí statické lokalizované SEO stránky, sitemap.xml a robots.txt.

## Obsah

Obsah jednotlivých jazykov je v `src/data/locales/`.

Program je zatiaľ zámerne prázdny (`program.json`, `items: []`). Keď bude harmonogram potvrdený, doplňte položky v rovnakom formáte vo všetkých jazykových mutáciách.

Potvrdení hostia v aktuálnej verzii:
- Marek Hora
- Gorin
- Noriko Komiyama
- Martin Labudík

## Poznámka k analytike

Projekt preberá technickú integráciu GTM/GA4 z pôvodnej verzie. Pred nasadením skontrolujte, či chcete pre `japanday.sk` používať rovnaké GTM/GA4 ID alebo samostatnú analytickú property.
