import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs';
import { newsletterPage } from '../../worker/src/newsletter-page.js';

for (const locale of ['sk','en','de','es','ja']) {
  const copy = JSON.parse(fs.readFileSync(`src/data/locales/${locale}/site.json`, 'utf8')).postEvent;
  test(`${locale} mocked API loading, failure, retry and success`, async ({ page }) => {
    const sent: any[] = [];
    let succeed = false;
    await page.route('**/api/**', async route => {
      expect(route.request().url()).toContain('127.0.0.1:4176');
      sent.push(route.request().postDataJSON());
      await new Promise(resolve => setTimeout(resolve, 250));
      await route.fulfill({ status: succeed ? 201 : 500, contentType: 'application/json', body: JSON.stringify({ ok: succeed }) });
    });
    await page.goto(`/tests/fixtures/community/?locale=${locale}`);
    const feedback = page.locator('.feedbackForm');
    await expect(feedback.locator('textarea')).toHaveCount(6);
    await expect(feedback.locator('input[type=email], input[name=name]')).toHaveCount(0);
    for (let i=0; i<6; i++) await expect(feedback.locator(`label[for=feedback-${i}]`)).toHaveText(copy.feedback.questions[i]);
    await feedback.locator('input[value="1"]').focus(); await page.keyboard.press('ArrowRight');
    await expect(feedback.locator('input[value="2"]')).toBeChecked();
    await feedback.locator('textarea').nth(3).fill('Matcha');
    await feedback.locator('button[type=submit]').click();
    await expect(feedback.locator('button[type=submit]')).toBeDisabled();
    await expect(feedback.getByRole('status')).toHaveText(copy.forms.loading);
    await expect(feedback.getByRole('status')).toHaveText(copy.forms.error);
    expect(sent[0].favourite_food_drink).toBe('Matcha'); expect(sent[0].locale).toBe(locale);
    await expect(feedback.getByRole('status')).not.toHaveText(copy.forms.success);
    succeed = true; await feedback.locator('button[type=submit]').click();
    await expect(feedback.getByRole('status')).toHaveText(copy.forms.success);
    await expect(feedback.locator('button[type=submit]')).toBeDisabled();
    const newsletter = page.locator('.newsletterCard form');
    await newsletter.locator('input[type=email]').fill('local@example.invalid');
    await expect(newsletter.locator('input[type=checkbox]')).not.toBeChecked();
    await newsletter.locator('button[type=submit]').click(); expect(sent).toHaveLength(2);
    await newsletter.locator('input[type=checkbox]').check();
    await newsletter.locator('button[type=submit]').click();
    await expect(newsletter.getByRole('status')).toHaveText(copy.forms.success);
    expect(sent).toHaveLength(3); expect(sent[2].consent).toBe(true);
    expect(sent[2].consentVersion).toBe('2026-01');
    await page.setViewportSize({ width: 360, height: 800 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  });
  test(`${locale} email scanners cannot confirm or unsubscribe through GET`, async ({ page }) => {
    for (const purpose of ['confirm', 'unsubscribe']) {
      const requests: any[] = [];
      await page.route('**/api/newsletter/**', async route => {
        requests.push(route.request().postDataJSON());
        await route.fulfill({ contentType: 'application/json', body: '{"ok":true}' });
      });
      await page.route(`**/newsletter/${purpose}?*`, async route => {
        const response = newsletterPage(new URL(route.request().url()), true);
        await route.fulfill({ headers: Object.fromEntries(response.headers), body: await response.text() });
      });
      await page.goto(`/newsletter/${purpose}?locale=${locale}#token=${'a'.repeat(64)}`);
      await expect(page.locator('button')).toBeEnabled();
      expect(requests).toHaveLength(0); expect(new URL(page.url()).hash).toBe('');
      await page.locator('button').click();
      await expect(page.getByRole('status')).not.toBeEmpty();
      expect(requests).toEqual([{ token: 'a'.repeat(64) }]);
      await expect(page.locator('button')).toBeDisabled();
    }
  });
}
