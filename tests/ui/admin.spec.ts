import { test, expect } from '../helpers/fixtures';

test('@ui admin static routes render and handle unauthenticated API access', async ({ page }) => {
  await page.route('https://api.japanday.sk/api/admin/**', route => route.fulfill({ status:401, contentType:'application/json', body:JSON.stringify({ok:false,error:{code:'UNAUTHENTICATED'}}) }));
  for (const path of ['/admin/','/admin/workshops/','/admin/workshops/w1/','/admin/sessions/s1/']) {
    const response = await page.goto(path, { waitUntil:'domcontentloaded' });
    expect(response?.status()).toBe(200);
    await expect(page.getByRole('heading',{name:'Workshop dashboard'})).toBeVisible();
    await expect(page.getByRole('alert')).toContainText('Sign in through your organization account');
    expect(await page.locator('body').innerText()).not.toContain('attendee@example.com');
  }
});

test('@ui admin workshop and session details render protected data', async ({ page }) => {
  await page.route('https://api.japanday.sk/api/admin/**', async route => {
    const url = new URL(route.request().url());
    const data = url.pathname.endsWith('/registrations')
      ? { session:{id:'japoncina-1100',start_at:'2026-11-07 11:00',capacity:1,registered_count:1,waitlist_count:0,available:0}, registrations:[{first_name:'Test',last_name:'Person',email:'person@example.com',phone:'123',status:'registered',payment_status:'free',created_at:'2026-01-01'}] }
      : { workshop:{id:'japoncina',title:'Workshop One',lecturer:'Lecturer',location:'Hall',short_description:'Description'}, sessions:[{id:'japoncina-1100',start_at:'2026-11-07 11:00',capacity:1,registered_count:1,waitlist_count:0,available:0}] };
    await route.fulfill({ status:200, contentType:'application/json', body:JSON.stringify({ok:true,data}) });
  });
  await page.goto('/admin/workshops/japoncina/');
  await expect(page.getByRole('heading',{name:'Workshop One'})).toBeVisible();
  await expect(page.getByRole('link',{name:/2026-11-07/})).toHaveAttribute('href','/admin/sessions/japoncina-1100/');
  await page.goto('/admin/sessions/japoncina-1100/');
  await expect(page.getByRole('cell',{name:'person@example.com'})).toBeVisible();
  await expect(page.getByText('Registered: 1 / 1')).toBeVisible();
});
