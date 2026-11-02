import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { localeCodes, read, publicRoutes, routePath } from './content';

for (const locale of localeCodes) {
  test(`@audit @data ${locale} JSON encoding and references`, async ({}, info) => {
    const issues: string[] = [];
    const walk = (value: any, key: string) => {
      if (typeof value === 'string' && /\uFFFD|Ãƒ|Ã‚|Ã¢|ï¿½|[\p{L}]\?+[\p{L}]|\?{2,}/u.test(value)) issues.push(`${key}: ${value}`);
      else if (Array.isArray(value)) value.forEach((v, i) => walk(v, `${key}[${i}]`));
      else if (value && typeof value === 'object') Object.entries(value).forEach(([k,v]) => walk(v, `${key}.${k}`));
    };
    for (const file of fs.readdirSync('src/data/locales/sk').filter(f => f.endsWith('.json'))) {
      const filename = path.resolve('src/data/locales', locale, file);
      expect(fs.existsSync(filename), filename).toBeTruthy();
      const text = fs.readFileSync(filename, 'utf8');
      const data = JSON.parse(text); walk(data, file);
      if (data.items?.every((p: any) => p.id)) expect(new Set(data.items.map((p: any) => p.id)).size, file).toBe(data.items.length);
    }
    const ids = new Set(read(locale, 'performers').items.map((p: any) => p.id));
    for (const p of read(locale, 'program').items) if (p.performerId) expect(ids.has(p.performerId), p.performerId).toBeTruthy();
    for (const w of read(locale, 'workshops').items) {
      if (w.lecturerId) expect(ids.has(w.lecturerId), w.id).toBeTruthy();
      for (const lecturer of w.lecturers || []) if (lecturer.performerId) expect(ids.has(lecturer.performerId), w.id).toBeTruthy();
    }
    await info.attach('encoding-issues', { body: JSON.stringify(issues, null, 2), contentType: 'application/json' });
    expect(issues).toEqual([]);
  });

  test(`@audit @data ${locale} current workshop requirements`, () => {
    const items = read(locale, 'workshops').items;
    for (const [id, count, minutes, capacity, lecturer] of [
      ['japoncina', 3, 30, null, 'hisayo-yasuda'], ['tsumami-zaiku', 2, 30, 2, 'hisayo-yasuda'],
      ['ayatori', 2, 30, 10, 'hisayo-yasuda'], ['kumihimo', 4, 45, 10, null],
      ['cajova-degustacia', 1, 45, 15, 'martin-labudik'], ['shodo', 3, 90, 20, 'akiko-komura'],
    ] as const) {
      const w = items.find((p: any) => p.id === id); expect(w, id).toBeTruthy();
      expect.soft(w.sessions.length, id).toBe(count); expect.soft(w.durationMinutes, id).toBe(minutes);
      if (capacity) expect.soft(w.sessions.map((s: any) => s.capacity), id).toEqual(Array(count).fill(capacity));
      if (lecturer) expect.soft(w.lecturerId, id).toBe(lecturer);
    }
    const w = items.find((p: any) => p.id === 'tvorba-kombiku');
    expect(w).toMatchObject({ durationMinutes: 15, registrationRequired: false, lecturerId: 'aiko-bosak', availabilityWindow: '11:00–14:30' });
    expect(w.sessions).toHaveLength(1); expect(w.sessions[0].end_at.slice(11,16)).toBe('14:30');
    expect(w.priceDisplay).toMatch(/2/); expect(w.availabilityNote).toBeTruthy();
  });

  test(`@audit @data ${locale} Hisayo has no schedule overlap`, async ({}, info) => {
    const mins = (s: string) => Number(s.slice(0,2))*60 + Number(s.slice(3,5));
    const activities: any[] = [];
    for (const w of read(locale, 'workshops').items) {
      if (w.lecturerId !== 'hisayo-yasuda' && !w.lecturers?.some((p: any) => p.performerId === 'hisayo-yasuda')) continue;
      const support = w.lecturers?.find((p: any) => p.performerId === 'hisayo-yasuda')?.role === 'support';
      for (const s of w.sessions) activities.push({ id: w.id, start: mins(s.start.slice(11,16)), end: mins(s.start.slice(11,16)) + w.durationMinutes, support });
    }
    for (const p of read(locale, 'program').items) if (p.performerId === 'hisayo-yasuda') activities.push({ id: p.title, start: mins(p.time), end: mins(p.endTime), support: false });
    activities.sort((a,b) => a.start-b.start);
    const conflicts = activities.flatMap((a,i) => activities.slice(i+1).filter(b => a.start < b.end && b.start < a.end).map(b => ({ a, b, optionalSupport: a.support || b.support })));
    await info.attach('hisayo-timeline', { body: JSON.stringify({ activities, conflicts }, null, 2), contentType: 'application/json' });
    expect(conflicts.filter(c => !c.optionalSupport)).toEqual([]);
  });

  test(`@audit @data ${locale} performer order images and Jana exhibitor`, () => {
    const items = read(locale, 'performers').items;
    expect(items.map((p: any) => [p.id, p.image])).toEqual(read('sk', 'performers').items.map((p: any) => [p.id, p.image]));
    expect(items[0].id).toBe('nao-higano');
    const jana = items.find((p: any) => p.id === 'japonske-kvety'); expect(jana).toBeTruthy();
    const exhibitors = read(locale, 'exhibitors').items.filter((p: any) => /Hemerocallis|Michalkov/i.test(JSON.stringify(p)));
    expect(exhibitors).toHaveLength(1);
    expect(JSON.stringify(jana)).toMatch(/Hemerocallis/);
  });

  test(`@audit @seo ${locale} every static route canonical hreflang sitemap`, () => {
    const sitemap = fs.readFileSync('dist/sitemap.xml', 'utf8');
    const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]);
    for (const route of publicRoutes(locale)) {
      const url = routePath(locale, route);
      const filename = path.join('dist', url, 'index.html');
      expect(fs.existsSync(filename), url).toBeTruthy();
      const html = fs.readFileSync(filename, 'utf8');
      expect(html, url).toContain(`rel="canonical" href="https://japanday.sk${url}"`);
      expect(urls, url).toContain(`https://japanday.sk${url}`);
      const languages = [...html.matchAll(/hreflang="([^"]+)"/g)].map(m => m[1]);
      expect(languages.sort(), url).toEqual(['sk','en','de','es','ja','x-default'].sort());
      for (const m of html.matchAll(/<link[^>]*hreflang="[^"]+"[^>]*href="https:\/\/japanday.sk([^"?#]*)"/g)) {
        expect(fs.existsSync(path.join('dist', m[1], 'index.html')), m[1]).toBeTruthy();
      }
    }
    expect(sitemap).not.toMatch(/hreflang="(?:zh|vi)/);
  });
}

