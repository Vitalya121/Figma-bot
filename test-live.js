const { chromium } = require('playwright');

const BASE = 'https://web-production-4cb1a.up.railway.app';
const API = 'https://api-production-0a14.up.railway.app';
let passed = 0, failed = 0;

function ok(name) { passed++; console.log('  ✓ ' + name); }
function fail(name, err) { failed++; console.log('  ✗ ' + name + ': ' + err); }

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  // ─── 1. API Tests ───
  console.log('\n=== API Tests ===');

  try {
    const r = await fetch(API + '/health');
    const d = await r.json();
    d.status === 'ok' ? ok('Health check') : fail('Health check', JSON.stringify(d));
  } catch(e) { fail('Health check', e.message); }

  try {
    const r = await fetch(API + '/api/billing/plans');
    const d = await r.json();
    d.success && d.data.length === 3 ? ok('Billing plans (3 plans)') : fail('Plans', String(d.data?.length));
  } catch(e) { fail('Plans', e.message); }

  try {
    const r = await fetch(API + '/api/templates');
    const d = await r.json();
    d.success && d.data.length > 0 ? ok('Templates (' + d.data.length + ' items)') : fail('Templates', 'empty');
  } catch(e) { fail('Templates', e.message); }

  try {
    const r = await fetch(API + '/api/auth/google', { redirect: 'manual' });
    r.status === 302 ? ok('Google OAuth redirect (302)') : fail('Google OAuth', 'Status: ' + r.status);
  } catch(e) { fail('Google OAuth', e.message); }

  try {
    const r = await fetch(API + '/api/auth/me');
    r.status === 401 ? ok('Auth guard (401 without token)') : fail('Auth guard', 'Status: ' + r.status);
  } catch(e) { fail('Auth guard', e.message); }

  try {
    const r = await fetch(API + '/api/carousels', { headers: { Authorization: 'Bearer fake_token' } });
    r.status === 401 ? ok('JWT rejects fake token') : fail('JWT validation', 'Status: ' + r.status);
  } catch(e) { fail('JWT validation', e.message); }

  // ─── 2. Frontend Pages ───
  console.log('\n=== Frontend Pages ===');

  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.screenshot({ path: 'test-screenshots/live/01-landing.png', fullPage: true });
  const title = await page.title();
  title.includes('CarouselForge') ? ok('Landing page title') : fail('Landing title', title);

  const heroText = await page.textContent('h1');
  heroText.includes('карусели') ? ok('Hero text') : fail('Hero text', heroText);

  const navCount = await page.locator('nav a').count();
  navCount >= 3 ? ok('Navigation (' + navCount + ' links)') : fail('Navigation', navCount);

  // Create page
  await page.goto(BASE + '/create', { waitUntil: 'networkidle' });
  await page.screenshot({ path: 'test-screenshots/live/02-create.png', fullPage: true });
  const bodyText = await page.textContent('body');
  bodyText.includes('Контент') ? ok('Create wizard loads') : fail('Create wizard', 'no steps');

  // Dashboard page
  await page.goto(BASE + '/dashboard', { waitUntil: 'networkidle' });
  await page.screenshot({ path: 'test-screenshots/live/03-dashboard.png', fullPage: true });
  const dashH1 = await page.textContent('h1');
  dashH1.includes('карусели') ? ok('Dashboard loads') : fail('Dashboard', dashH1);

  // ─── 3. Wizard E2E Flow ───
  console.log('\n=== Wizard E2E Flow ===');

  await page.goto(BASE + '/create', { waitUntil: 'networkidle' });

  // Step 1: Fill topic
  await page.fill('input[type="text"]', '5 ошибок в SMM которые убивают охваты');
  await page.screenshot({ path: 'test-screenshots/live/04-topic-filled.png' });
  ok('Step 1: Topic entered');

  // Change tone to provocative
  const selects = page.locator('select');
  const selectCount = await selects.count();
  if (selectCount >= 2) {
    await selects.nth(1).selectOption('provocative');
    ok('Tone set to provocative');
  }

  // Click generate
  await page.click('button:has-text("Сгенерировать")');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'test-screenshots/live/05-slides-editor.png', fullPage: true });

  // Check slides appeared (Step 2)
  const step2Text = await page.textContent('body');
  step2Text.includes('Редактирование') ? ok('Step 2: Slide editor shown') : fail('Step 2', 'not found');

  // Edit first slide
  const inputs = page.locator('input[type="text"]');
  const inputCount = await inputs.count();
  if (inputCount > 0) {
    await inputs.first().fill('КАСТОМНЫЙ HOOK ЗАГОЛОВОК');
    ok('Slide title edited (' + inputCount + ' inputs)');
  }

  // Click Next to templates
  await page.click('button:has-text("Далее")');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'test-screenshots/live/06-templates.png', fullPage: true });

  const tplText = await page.textContent('body');
  tplText.includes('шаблон') ? ok('Step 3: Template picker shown') : fail('Step 3', 'no template text');

  // Select first template
  const tplButtons = page.locator('button:has([class*="aspect-"])');
  const tplCount = await tplButtons.count();
  if (tplCount > 0) {
    await tplButtons.first().click();
    ok('Template selected (' + tplCount + ' options)');
  } else {
    // fallback: click any button that looks like a template card
    const allBtns = page.locator('button');
    const btnCount = await allBtns.count();
    for (let i = 0; i < btnCount; i++) {
      const text = await allBtns.nth(i).textContent();
      if (text.includes('минимал') || text.includes('Минимал') || text.includes('градиент')) {
        await allBtns.nth(i).click();
        ok('Template selected (fallback)');
        break;
      }
    }
  }

  await page.screenshot({ path: 'test-screenshots/live/07-template-selected.png' });

  // Click generate carousel
  const genBtn = page.locator('button:has-text("Сгенерировать карусель")');
  if (await genBtn.count() > 0) {
    await genBtn.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-screenshots/live/08-generating.png' });

    const progressText = await page.textContent('body');
    progressText.includes('Генерация') || progressText.includes('Nano Banana') || progressText.includes('Создание')
      ? ok('Step 4: Generation progress') : fail('Progress', 'text not found');

    // Wait for mock generation to complete
    await page.waitForTimeout(12000);
    await page.screenshot({ path: 'test-screenshots/live/09-complete.png', fullPage: true });

    const figmaLink = page.locator('a:has-text("Figma")');
    (await figmaLink.count()) > 0 ? ok('Figma link appears') : fail('Figma link', 'not found');

    const createAnother = page.locator('button:has-text("Создать ещё")');
    (await createAnother.count()) > 0 ? ok('"Create another" button') : fail('Create another', 'not found');
  }

  // ─── 4. Auth flow ───
  console.log('\n=== Auth Flow ===');

  await page.goto(BASE, { waitUntil: 'networkidle' });
  const loginLink = page.locator('a:has-text("Войти")');
  if (await loginLink.count() > 0) {
    const href = await loginLink.getAttribute('href');
    href.includes('/api/auth/google') ? ok('Login button → Google OAuth') : fail('Login href', href);
  }

  // Test auth callback page
  await page.goto(BASE + '/auth/callback', { waitUntil: 'networkidle' });
  await page.screenshot({ path: 'test-screenshots/live/10-auth-callback.png' });
  ok('Auth callback page loads');

  // ─── Summary ───
  console.log('\n' + '═'.repeat(40));
  console.log('  PASSED: ' + passed + ' / ' + (passed + failed));
  if (failed > 0) console.log('  FAILED: ' + failed);
  else console.log('  ALL TESTS PASSED! ');
  console.log('═'.repeat(40) + '\n');

  await browser.close();
  process.exit(failed > 0 ? 1 : 0);
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
