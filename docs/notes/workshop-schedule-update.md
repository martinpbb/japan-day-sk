# Updated workshop schedule — 7 November 2026

Branch `main`; starting HEAD `3b4bc38`. Continues existing uncommitted catalogue and display-helper changes. Fixed session data is stored in `src/data/locales/sk/workshops.json`.

| Time | Workshop | Instructor | Price | Capacity |
| --- | --- | --- | --- | --- |
| 10:40–12:10 | Origami 1 | Asuka Emura; Hisayo Yasuda | Free | Unknown |
| 10:40–12:10 | Kumihimo 1 | Mgr. Ivana Mičkalová | Free | Unknown |
| 10:40–12:10 | Shodō 1 | Mgr. Akiko Komura, Ph.D.; Mgr. František Paulovič, PhD. | Free | 20 |
| 11:00–11:45 | Japanese language 1 | Hisayo Yasuda | Free | Unknown |
| 12:10–13:40 | Origami 2 | Asuka Emura; Hisayo Yasuda | Free | Unknown |
| 12:10–13:40 | Kumihimo 2 | Mgr. Ivana Mičkalová | Free | Unknown |
| 12:15–13:15 | Tsumami zaiku | Hisayo Yasuda | Unconfirmed | Unknown |
| 12:40–14:10 | Shodō 2 | Mgr. Akiko Komura, Ph.D.; Mgr. František Paulovič, PhD. | Free | 20 |
| 13:40–15:10 | Origami 3 | Asuka Emura; Hisayo Yasuda | Free | Unknown |
| 13:40–15:10 | Kumihimo 3 | Mgr. Ivana Mičkalová | Free | Unknown |
| 14:00–14:45 | Japanese language 2 | Hisayo Yasuda | Free | Unknown |
| 14:40–16:10 | Shodō 3 | Mgr. Akiko Komura, Ph.D.; Mgr. František Paulovič, PhD. | Free | 20 |
| 15:15–16:15 | Ayatori | Hisayo Yasuda | Free | Max. 10 |
| Unconfirmed | Tvorba gombíkov | Aiko Bosák | Free | Unknown |
| Unconfirmed | Tea tasting — Japanese gastronomy | Ing. Martin Labudík | Free | Unknown |

Tsumami is assigned the first fixed craft block and Ayatori the second. Their price values remain unconfirmed (the old tsumami €10 copy was removed rather than carried forward as a confirmed fact). Button-making and tea-tasting times and durations are unconfirmed. Unknown details remain unset.

## Constraint checks and conflicts

- Japanese language has exactly two 45-minute sessions at 11:00–11:45 and 14:00–14:45.
- Tsumami uses 12:15–13:15 and does not overlap either language session. Ayatori uses 15:15–16:15.
- Ayatori lists Hisayo Yasuda and a capacity of 10 per session.
- Kumihimo has the same three 90-minute times as Origami, is free and lists Mgr. Ivana Mičkalová.
- Shodō uses 10:40–12:10, 12:40–14:10 and 14:40–16:10, with a 30-minute break each time.
- Tea tasting is categorized as Japanese gastronomy.
- Origami and Shodō fixed times were preserved. No performance times changed; the current performance programme is empty.

**Instructor conflict requiring confirmation:** Hisayo Yasuda is listed for Origami at 10:40–12:10, 12:10–13:40 and 13:40–15:10, which overlaps both Japanese-language sessions and the 12:15–13:15 Tsumami session. The 15:15 Ayatori session starts after Origami ends. Confirm whether Hisayo can teach concurrently, whether Origami has another instructor covering these times, or whether one assignment must change. Asuka Emura has not been assumed to cover Origami alone.

Separate space is also required for overlapping workshops; locations remain unknown. Tea tasting and button-making times are unconfirmed. Live API availability/prices may override local fallback details; production parity was not changed.

## Validation

Pending for this update. The pre-existing `src/lib/workshops.js` working-tree change was preserved.
