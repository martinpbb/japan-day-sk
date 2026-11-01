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
  expect(talks.map((item: any) => item.time)).toEqual(["11:30", "12:20", "13:10", "14:00", "14:50", "15:40"]);
  expect(talks.map((item: any) => [item.time, item.performerId, item.title])).toEqual([
    ["11:30", "hisayo-yasuda", "Príťažlivosť Japonska"],
    ["12:20", "martin-labudik", "Ako japonský čaj prospieva ľudskému telu"],
    ["13:10", "japonske-kvety", "Ľaliovky – kúsok Japonska v záhrade i na tanieri"],
    ["14:00", "akiko-komura", "Shodō: japonská kaligrafia"],
    ["14:50", "martin-labudik", "Japonský čaj a jeho rozdelenie"],
    ["15:40", "silvestr-prajer", "Sengoku jidai: obdobie bojujúcich štátov"],
  ]);
  expect(talks[3].presenter).toBe("Mgr. Akiko Komura, PhD.");
  expect(data.items.some((item: any) => item.title === "Bez pódiového programu")).toBeFalsy();
  expect(data.items.some((item: any) => item.title === "Ako japonský čaj pomáha zdraviu")).toBeFalsy();
  const gorin = data.items.filter((item: any) => item.performerId === "gorin");
  const sengoku = talks.find((item: any) => item.performerId === "silvestr-prajer");
  const tameshigiri = gorin.find((item: any) => item.title.startsWith("Tameshigiri"));
  expect(tameshigiri.time).toBe(sengoku.endTime);
  expect(Number(tameshigiri.time.slice(0, 2)) * 60 + Number(tameshigiri.time.slice(3)) - (Number(sengoku.endTime.slice(0, 2)) * 60 + Number(sengoku.endTime.slice(3)))).toBe(0);
});

test("@data workshop sessions match the confirmed schedule in each locale", () => {
  const expected: Record<string, [string, number][]> = {
    japoncina: [["11:00", 45], ["12:15", 45], ["13:30", 45]],
    origami: [["11:00", 90], ["13:00", 90]],
    "tsumami-zaiku": [["11:00", 90], ["13:00", 90]],
    ayatori: [["15:00", 60]],
    shodo: [["11:00", 90], ["13:00", 90]],
    kumihimo: [["11:00", 90], ["13:00", 90], ["15:00", 90]],
    "tvorba-kombiku": [],
    "cajova-degustacia": [],
  };
  for (const locale of ["sk", "en", "de", "es", "ja"]) {
    const data = JSON.parse(fs.readFileSync(path.join(root, locale, "workshops.json"), "utf8"));
    for (const [id, sessions] of Object.entries(expected)) {
      const workshop = data.items.find((item: any) => item.id === id);
      expect(workshop).toBeTruthy();
      expect(workshop.sessions.map((session: any) => [session.start.slice(11, 16), workshop.durationMinutes])).toEqual(sessions);
      expect(workshop.sessions.every((session: any) => session.start.endsWith("+01:00"))).toBeTruthy();
      if (["tsumami-zaiku", "ayatori"].includes(id)) expect(workshop.lecturerId).toBe("aiko-bosak");
    }
    const workshops = Object.fromEntries(data.items.map((item: any) => [item.id, item]));
    expect(workshops.japoncina.sessions.map((session: any) => session.id)).toEqual(["japoncina-1100", "japoncina-1215", "japoncina-1330"]);
    expect(workshops.japoncina.durationMinutes).toBe(45);
    expect(workshops.shodo.sessions[1].start.slice(11, 16)).toBe("13:00");
    expect(workshops.shodo.durationMinutes).toBe(90);
    expect(workshops.ayatori.sessions[0].capacity).toBe(10);
    expect(workshops.origami.sessions.map((session: any) => session.start)).toEqual(workshops["tsumami-zaiku"].sessions.map((session: any) => session.start));
    expect(workshops.origami.durationMinutes).toBe(90);
    expect(workshops["tsumami-zaiku"].durationMinutes).toBe(90);
    expect(workshops.origami.lecturerId).toBe("asuka-emura");
    expect(workshops.origami.lecturers).toEqual([
      { performerId: "asuka-emura", role: "lead" },
      { performerId: "hisayo-yasuda", role: "support" },
    ]);
    expect(workshops.origami.lecturers[0].performerId).not.toBe("aiko-bosak");
    expect(workshops["tsumami-zaiku"]).toMatchObject({ paid: true, priceCents: 1000, currency: "EUR", lecturerId: "aiko-bosak" });
    expect(workshops.origami.sessions.every((session: any) => session.areaId === "shared-workshop-area")).toBeTruthy();
    expect(workshops["tsumami-zaiku"].sessions.every((session: any) => session.areaId === "shared-workshop-area")).toBeTruthy();
    expect(workshops["tvorba-kombiku"].sessions).toEqual([]);
    expect(workshops["cajova-degustacia"].sessions).toEqual([]);
  }
});

test("@data reports real lecturer conflicts and the zero-buffer warning without treating intentional sharing as a conflict", () => {
  const workshops = JSON.parse(fs.readFileSync(path.join(root, "sk", "workshops.json"), "utf8")).items;
  const byId = Object.fromEntries(workshops.map((item: any) => [item.id, item]));
  const theatre = read("sk").items.filter((item: any) => item.venue === "theatre");
  const overlaps = (startA: string, durationA: number, startB: string, durationB: number) => {
    const minutes = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3));
    return minutes(startA) < minutes(startB) + durationB && minutes(startB) < minutes(startA) + durationA;
  };

  expect(overlaps(byId.japoncina.sessions[0].start.slice(11, 16), 45, theatre[0].time, 40)).toBeTruthy();
  expect(overlaps(byId.shodo.sessions[1].start.slice(11, 16), 90, theatre[3].time, 40)).toBeTruthy();
  expect(overlaps(byId.origami.sessions[0].start.slice(11, 16), 90, byId.japoncina.sessions[0].start.slice(11, 16), 45)).toBeTruthy();
  expect(byId.origami.lecturers.find((person: any) => person.performerId === "hisayo-yasuda").role).toBe("support");
  expect(byId.origami.sessions[0].areaId).toBe(byId["tsumami-zaiku"].sessions[0].areaId);
  expect(theatre[5].endTime).toBe("16:20");
  expect(read("sk").items.find((item: any) => item.title.startsWith("Tameshigiri")).time).toBe("16:20");
});
