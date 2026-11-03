import { test, expect } from '../helpers/fixtures';

import { assertImages } from '../helpers/assertions';

const viewports = [{ width:1600,height:900 },{ width:1366,height:768 },{ width:768,height:1024 },{ width:390,height:844 }];
for (const viewport of viewports) for (const [name, route] of [
  ['home-sk','/'],['home-ja','/ja/'],['program-sk','/program/'],['workshops-sk','/workshopy/'],['workshops-ja','/ja/workshopy/'],
  ['hisayo','/ucinkujuci/hisayo-yasuda/'],['jana','/ucinkujuci/japonske-kvety/'],['workshop-detail','/workshopy/japoncina/'],
] as const) test(`@audit @responsive @visual ${name} ${viewport.width}`, async ({ page }, info) => {
  test.setTimeout(60_000);
  await page.setViewportSize(viewport); await page.goto(route, { waitUntil:'domcontentloaded' });
  await expect(page.locator('main h1')).toBeVisible();
  await page.evaluate(async () => { await document.fonts.ready; for(let y=0;y<document.body.scrollHeight;y+=600) { window.scrollTo(0,y); await new Promise(r => setTimeout(r,30)); } window.scrollTo(0,0); });
  await assertImages(page);
  await page.evaluate(() => window.scrollTo(0,0));
  await page.screenshot({ path:info.outputPath(`${name}-${viewport.width}-consent.png`),fullPage:true });
  if (await page.getByRole("dialog").isVisible()) await page.getByRole("dialog").getByRole("button").first().click();
  await page.screenshot({ path:info.outputPath(`${name}-${viewport.width}.png`),fullPage:true });
  expect.soft(await page.evaluate(() => document.documentElement.scrollWidth), 'horizontal overflow').toBeLessThanOrEqual(viewport.width);
  if (route === '/' || route === '/ja/') {
    const geometry = await page.locator('.heroCard').evaluate(card => {
      const box = card.getBoundingClientRect();
      return [...card.querySelectorAll('.pbMountain,.verticalText')].map(el => { const r=el.getBoundingClientRect(); return { name:el.className, contained:r.left >= box.left && r.right <= box.right && r.top >= box.top && r.bottom <= box.bottom, box:{ x:box.x,y:box.y,width:box.width,height:box.height }, child:{ x:r.x,y:r.y,width:r.width,height:r.height } }; });
    });
    await info.attach('hero-geometry',{ body:JSON.stringify(geometry,null,2), contentType:'application/json' });
    for (const item of geometry) expect.soft(item.contained,item.name).toBeTruthy();
    const overlaps = await page.locator('.heroCard').evaluate(card => {
      const vertical = card.querySelector('.verticalText')!.getBoundingClientRect();
      const facts = card.querySelector('.heroCardText')!.getBoundingClientRect();
      return vertical.left < facts.right && facts.left < vertical.right && vertical.top < facts.bottom && facts.top < vertical.bottom;
    });
    expect.soft(overlaps, 'vertical Japanese text must not overlap card date/title').toBeFalsy();
  }
});


