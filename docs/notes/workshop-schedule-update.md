# Schedule correction - 7 November 2026

Corrected the locally implemented schedule without deployment or production API/D1 changes.

## Current local data

- Slovak Puppet Theatre order is Hisayo Yasuda (11:30), Martin Labudík (12:20), Jana Michalková (13:10), Akiko Komura (14:00), Martin Labudík (14:50), and Silvestr Prajer (15:40); each talk is 40 minutes with 10-minute gaps. Capacity remains approximately 100.
- The Great Hall retains its approved entries. The 15:00-16:20 gap after Judo is empty; there is no public "Bez pódiového programu" item.
- Origami is a separate 90-minute workshop led by Asuka Emura, with Hisayo Yasuda as optional support. Tsumami zaiku remains separate, led by Aiko Bosák, costs €10, and has matching session times. Both use `shared-workshop-area`; per-session capacity remains unset because a shared room capacity is not modeled.
- Ayatori remains led by Aiko Bosák at 15:00-16:00, capacity 10. Shodō remains at 11:00-12:30 and 13:00-14:30, capacity 20 per session, with Akiko Komura and Mgr. František Paulovič, PhD.
- Workshop IDs, times, durations, prices, capacities and lecturer assignments remain structurally synchronized across `sk`, `en`, `de`, `es`, and `ja`. Button-making and tea tasting remain unscheduled.

## Unresolved schedule findings

- **Real conflict:** Hisayo's Japončina I (11:00-12:00) overlaps her 11:30-12:10 lecture, Príťažlivosť Japonska. Do not move either activity.
- **Real conflict:** Akiko's Shodō II (13:00-14:30) overlaps her 14:00-14:40 lecture, Shodō: japonská kaligrafia. Do not move either activity.
- **Operational warning:** Silvestr's lecture ends at 16:20, exactly when Gorin's tameshigiri begins. There is no transfer/preparation buffer, but no time overlap.
- Origami and Tsumami zaiku intentionally use the same physical area and times. They are separate groups and registration flows. Hisayo is optional support for Origami, so her Japončina overlap does not make Origami invalid. No shared capacity is invented.

## Integration blocker

Workshop detail pages prefer live sessions from `https://api.japanday.sk` when the API responds; local sessions are a fallback. Production API/D1 was not inspected or modified. Therefore production registration schedule parity remains unverified. No deployment was performed.

## Verification

Correction-specific checks passed: targeted Playwright data and UI specs (5/5 on Chromium), `npm run lint`, `npm run build`, and `git diff --check`. The programme UI and workshop cards were checked in Slovak. The full Playwright suite is not required for this task; prior unrelated `zh`/`vi`, alternate-language link-count, and parallel timeout failures remain out of scope.
