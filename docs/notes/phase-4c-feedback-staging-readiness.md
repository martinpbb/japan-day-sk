# Fáza 4C — pripravenosť izolovaného testovania spätnej väzby

Stav: lokálna konfigurácia a testy sú pripravené. Vzdialené zdroje, migrácia na Cloudflare, API/web deploy a verejné prijímanie spätnej väzby sa v tejto fáze nevykonali.

## Navrhnutá izolácia

- API Worker: `japanday-workshops-api-staging`, samostatný `worker/wrangler.staging.toml`, workers.dev, bez custom domain a bez produkčných routes.
- Staging D1: `japanday-workshops-staging`, výhradne samostatné ID; v konfigurácii ostáva zámerný placeholder. Produkčné ID `26f5af16-c3ee-4768-bf77-3d347c104e9f` sa v staging konfigurácii nenachádza.
- Lokálny D1: `worker/wrangler.staging.local.toml`, databáza `japanday-workshops-staging-local` a neexistujúce nulové UUID. Wrangler nainštaloval lokálne migrácie 0001–0007; žiadny remote D1 príkaz sa nepoužil.
- Origin aj Turnstile hostname: presne `https://japanday-sk-web-staging.marzo2k.workers.dev` a `japanday-sk-web-staging.marzo2k.workers.dev`. Staging Worker odmieta inú, chýbajúcu aj nekanonickú Origin.
- Rate limiter: oddelená hodnota `1002` je len návrh/placeholder; pred vytvorením namespace musí vlastník potvrdiť, že je v účte jedinečná a nekoliduje s produkciou.
- Worker secrets mimo repozitára: samostatné staging hodnoty `TURNSTILE_SECRET_KEY` a náhodný `ABUSE_HMAC_SECRET` (min. 32 znakov). Nikdy sa nekopírujú do Vite ani GitHub build variables.
- `FEEDBACK_ENABLED` zostáva `false`; newsletter signup aj token akcie sú vypnuté. API nemá mailer service binding ani Brevo konfiguráciu. Staging build povoľuje výhradne API origin `https://japanday-workshops-api-staging.marzo2k.workers.dev`; GitHub variable sa musí zhodovať presne.
- Ručne spúšťaný web deploy workflow je obmedzený na `feature/post-event-2026` a číta výhradne `STAGING_*` GitHub Environment variables. Nový `feedback-staging-preview.yml` vykoná validáciu a uloží artefakt; nemá Cloudflare credentials ani deploy krok.

## Lokálne overenie a hranice

Prešiel staging wrapper → Worker feedback handler → izolovaný D1 s migrovanou schémou 0007. Siteverify bol simulovaný; Cloudflare Turnstile, vzdialený staging API a staging web sa nekontaktovali.

- Anonymous valid feedback, zápis a čítanie D1 pre `sk`, `en`, `de`, `es`, `ja`: PASS.
- Prázdne/nesprávne odpovede, nesprávny/expirujúci Turnstile, iný hostname, replay tokenu, rate limit, cudzí/chýbajúci Origin: PASS.
- Siteverify sieťová chyba, D1 chyba a generická odpoveď bez úniku detailov: PASS.
- Newsletter signup zostal vypnutý; UI testy potvrdili iba feedback requesty a žiadny newsletter formulár: PASS.
- Produkčné D1 ID absentuje v staging/local config; plné Worker testy workshop registrácií, kapacity, waitlistu, platieb, Access a dostupnosti: PASS.
- Skutočný staging-web → Cloudflare Turnstile → vzdialený staging Worker → staging D1: NOT RUN — vyžaduje vzdialené zdroje a deploy, ktoré boli výslovne zakázané.

## Potrebné Cloudflare/GitHub Dashboard kroky pred vzdialeným testom

1. Vytvoriť samostatnú D1 `japanday-workshops-staging`, uložiť jej ID do staging Worker konfigurácie a vizuálne potvrdiť, že sa nerovná produkčnému ID. Následne aplikovať migrácie iba na staging: `npx wrangler d1 migrations apply japanday-workshops-staging --remote --config worker/wrangler.staging.toml`.
2. Vytvoriť staging-only Turnstile widget, Managed režim, hostiteľ `japanday-sk-web-staging.marzo2k.workers.dev`, bez pre-clearance. Site key patrí iba do staging web build variable; secret iba do staging Worker secret.
3. Zvoliť a overiť účetne jedinečný integer limiter namespace; nastaviť `TURNSTILE_SECRET_KEY` a `ABUSE_HMAC_SECRET` ako samostatné Worker secrets.
4. V Cloudflare Workers skontrolovať samostatný názov a endpoint `https://japanday-workshops-api-staging.marzo2k.workers.dev`, D1 binding `DB`, limiter binding, presné vars/origin, vypnuté newsletter prepínače a chýbajúce production custom domain/routes. V GitHub Environment `cloudflare-staging` nastaviť `STAGING_COMMUNITY_API_BASE` presne na tento endpoint a `STAGING_TURNSTILE_SITE_KEY`; `STAGING_FEEDBACK_ENABLED` ponechať `false`, kým nebudú vyriešené privacy rozhodnutia.
5. Pred zapnutím web feedback nastaviť `STAGING_FEEDBACK_PRIVACY_APPROVED` iba po schválení privacy copy vlastníkom. Každý site key/API URL sú verejné hodnoty, nie tajomstvá.

## Nasadenie a návrat späť — budúci samostatne schválený postup

1. Zaznamenať staging D1 ID a výsledok kontroly odlišnosti od production. Aplikovať migrations 0001–0007 len na staging pomocou uvedeného `--remote` príkazu; overiť migration ledger, `quick_check`, tabuľky 0007 a nulový počet feedback riadkov.
2. Pridať staging Worker secrets, nastaviť jedinečný limiter namespace a overiť dashboard bindings. Najskôr deploynúť API s `FEEDBACK_ENABLED=false`: `npx wrangler deploy --config worker/wrangler.staging.toml`.
3. Nastaviť staging Siteverify tajný kľúč; spustiť lokálne regresné testy. Po privacy schválení povoliť iba staging `FEEDBACK_ENABLED=true` a znovu deploynúť API. Následne manuálne spustiť `cloudflare-staging.yml` z feature vetvy s GitHub staging variables. Nikdy nespúšťať produkčné workflowy.
4. Overiť hostname/Origin, jednu označenú testovú odpoveď a jej staging D1 záznam, replay/rate-limit/error prípady, žiadne newsletter volania a nezmenené produkčné D1/workshop záznamy. Testovacie riadky odstrániť podľa schválenej retencie.
5. Rollback: okamžite vypnúť staging `FEEDBACK_ENABLED`, deploynúť API konfiguráciu s flagom `false`, nastaviť `STAGING_FEEDBACK_ENABLED=false` a znovu deploynúť staging web. Ak treba obnoviť kód Workeru, v Cloudflare dashboarde zvoliť známu verziu s flagom `false` alebo použiť `npx wrangler rollback --config worker/wrangler.staging.toml`; web Worker obdobne `npx wrangler rollback --config wrangler.web-staging.jsonc`. D1 migrácie sa pri rollbacku nemažú ani nereverzujú; staging dáta sa ponechajú/odstránia iba podľa schváleného postupu.

## Neuzavreté blokery ochrany súkromia

Zverejnený copy správne upozorňuje, že voľný text môže identifikovať osobu a nemajú sa uvádzať citlivé ani kontaktné údaje. Pred skutočným prijímaním odpovedí vlastník musí schváliť: (1) prevádzkovateľa/kontrolóra, (2) kontaktnú adresu, (3) lehotu uchovávania, (4) proces vybavenia prístupu/vymazania, (5) lehotu a spôsob vymazania dát zo záloh. Cloudflare processor terms/lawful basis a postup retencie/mazania treba takisto vyriešiť. Žiadne právne schválenie sa tu nepredpokladá ani nevymýšľa.
