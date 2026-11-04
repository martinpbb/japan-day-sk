import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.cwd(), "src/data/locales");
const read = (locale: string) => JSON.parse(fs.readFileSync(path.join(root, locale, "program.json"), "utf8"));

test("@data confirmed Slovak programme contains the complete venue schedule", () => {
  const data = read("sk");
  expect(data.status).toBe("confirmed");
  expect(data.items).toHaveLength(17);
  expect(data.items.filter((item: any) => item.venue === "hall")).toHaveLength(11);
  expect(data.items.filter((item: any) => item.venue === "theatre")).toHaveLength(6);
  expect(data.items.find((item: any) => item.title.startsWith("Tameshigiri"))).toMatchObject({ time: "16:20", endTime: "16:50" });
  expect(data.items.find((item: any) => item.title.startsWith("Záverečné"))).toMatchObject({ time: "16:50", endTime: "17:00" });
  expect(data.items.find((item: any) => item.time === "15:00" && item.venue === "hall")).toBeUndefined();

  for (const item of data.items) {
    const [startHour, startMinute] = item.time.split(":").map(Number);
    const [endHour, endMinute] = item.endTime.split(":").map(Number);
    expect((endHour * 60 + endMinute) - (startHour * 60 + startMinute)).toBe(item.durationMinutes);
  }
  const talks = data.items.filter((item: any) => item.venue === "theatre");
  for (let index = 1; index < talks.length; index += 1) {
    expect(talks[index].time >= talks[index - 1].endTime).toBeTruthy();
  }
  expect(talks.map((item: any) => [item.time, item.endTime, item.performerId])).toEqual([["11:30", "12:10", "japonske-kvety"], ["12:20", "13:00", "martin-labudik"], ["13:10", "13:50", "akiko-komura"], ["14:40", "15:20", "silvestr-prajer"], ["15:30", "16:10", "martin-labudik"], ["16:10", "16:50", "hisayo-yasuda"]]);
  expect(talks[2].presenter).toBe("Mgr. Akiko Komura, PhD.");
  expect(data.items.filter((item: any) => item.performerId === "nao-higano").every((item: any) => item.title === "Japonské piesne – vystúpenie sopranistky Nao Higano")).toBeTruthy();
  expect(data.items.some((item: any) => item.title === "Bez pódiového programu")).toBeFalsy();
  expect(data.items.some((item: any) => item.title === "Ako japonský čaj pomáha zdraviu")).toBeFalsy();
  const tameshigiri = data.items.find((item: any) => item.title.startsWith("Tameshigiri"));
  expect(tameshigiri.time).toBe("16:20");
});

test("@data every locale publishes the approved theatre schedule", () => {
  const expected = [["11:30", "12:10", "japonske-kvety"], ["12:20", "13:00", "martin-labudik"], ["13:10", "13:50", "akiko-komura"], ["14:40", "15:20", "silvestr-prajer"], ["15:30", "16:10", "martin-labudik"], ["16:10", "16:50", "hisayo-yasuda"]];
  for (const locale of ["sk", "en", "de", "es", "ja"]) {
    const talks = read(locale).items.filter((item: any) => item.venue === "theatre");
    expect(talks.map((item: any) => [item.time, item.endTime, item.performerId]), locale).toEqual(expected);
  }
});

test("@data workshop schedules match current approved requirements in every locale", () => {
  for (const locale of ["sk", "en", "de", "es", "ja"]) {
    const data = JSON.parse(fs.readFileSync(path.join(root, locale, "workshops.json"), "utf8"));
    const workshops = Object.fromEntries(data.items.map((item: any) => [item.id, item]));
    const starts = (id: string) => workshops[id].sessions.map((session: any) => session.start.slice(11, 16));
    expect(starts("japoncina")).toEqual(["11:30", "13:30", "15:30"]);
    expect(workshops.japoncina).toMatchObject({ lecturerId: "hisayo-yasuda", durationMinutes: 30 });
    expect(workshops.japoncina.sessions.map((session: any) => session.capacity)).toEqual([15, 15, 15]);
    expect(workshops["tsumami-zaiku"]).toMatchObject({ lecturerId: "hisayo-yasuda", durationMinutes: 30 });
    expect(workshops["tsumami-zaiku"].sessions.map((session: any) => session.capacity)).toEqual([2, 2]);
    expect(workshops.ayatori).toMatchObject({ lecturerId: "hisayo-yasuda", durationMinutes: 30 });
    expect(workshops.ayatori.sessions.map((session: any) => session.capacity)).toEqual([10, 10]);
    expect(workshops.kumihimo.durationMinutes).toBe(45);
    expect(workshops.kumihimo.sessions).toHaveLength(4);
    expect(workshops.kumihimo.sessions.map((session: any) => session.capacity)).toEqual([10, 10, 10, 10]);
    expect(workshops["tvorba-kombiku"]).toMatchObject({ durationMinutes: 15, registrationRequired: false });
    expect(workshops["tvorba-kombiku"].availabilityWindow).toMatch(/^11:30.*15:00$/);
    expect(workshops["tvorba-kombiku"].priceDisplay).toMatch(/2/);
    expect(workshops["tvorba-kombiku"].sessions).toHaveLength(1);
    expect(workshops["cajova-degustacia"]).toMatchObject({ durationMinutes: 45 });
    expect(workshops["cajova-degustacia"].sessions[0].capacity).toBe(15);
    expect(data.items.every((workshop: any) => workshop.sessions.every((session: any) => session.start.endsWith("+01:00")))).toBeTruthy();
  }
});

test("@data confirms Hisayo has no overlapping lead activities", () => {
  const workshops = JSON.parse(fs.readFileSync(path.join(root, "sk", "workshops.json"), "utf8")).items;
  const activities: { start: number; end: number; support: boolean }[] = [];
  const minute = (value: string) => Number(value.slice(0, 2)) * 60 + Number(value.slice(3, 5));
  for (const workshop of workshops) {
    const lead = workshop.lecturerId === "hisayo-yasuda";
    const support = workshop.lecturers?.some((lecturer: any) => lecturer.performerId === "hisayo-yasuda" && lecturer.role === "support");
    if (!lead && !support) continue;
    for (const session of workshop.sessions) activities.push({ start: minute(session.start.slice(11, 16)), end: minute(session.start.slice(11, 16)) + workshop.durationMinutes, support: !lead && !!support });
  }
  for (const item of read("sk").items) if (item.performerId === "hisayo-yasuda") activities.push({ start: minute(item.time), end: minute(item.endTime), support: false });
  const conflicts = activities.flatMap((a, i) => activities.slice(i + 1).filter(b => a.start < b.end && b.start < a.end && !a.support && !b.support));
  expect(conflicts).toEqual([]);
});
