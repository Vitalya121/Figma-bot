const { chromium } = require('playwright');

const BASE = 'https://web-production-4cb1a.up.railway.app';
const API = 'https://api-production-0a14.up.railway.app';
let passed = 0, failed = 0;

function ok(name) { passed++; console.log('  ✓ ' + name); }
function fail(name, err) { failed++; console.log('  ✗ ' + name + ': ' + err); }

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  console.log('\n=== API: AI Generation ===');

  try {
    const r = await fetch(API + '/api/generate/slides', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic: 'Как создать вирусный Reels', slideCount: 5, tone: 'friendly', language: 'ru' }),
    });
    const d = await r.json();
    if (d.success && d.data.length === 5) {
      ok('AI generates ' + d.data.length + ' slides for topic');
      const titles = d.data.map(s => s.title);
      const hasUnique = new Set(titles).size === titles.length;
      hasUnique ? ok('All slide titles are unique') : fail('Unique titles', titles.join(', '));
    } else {
      fail('AI generation', JSON.stringify(d).slice(0, 200));
    }
  } catch (e) { fail('AI generation', e.message); }

  console.log('\n=== Wizard: Full E2E with AI ===');

  await page.goto(BASE + '/create', { waitUntil: 'networkidle' });
  await page.screenshot({ path: 'test-screenshots/live/v2-01-create.png' });
  ok('Create page loads');

  // Enter topic
  await page.fill('input[type="text"]', 'Как увеличить продажи через Instagram Stories');
  ok('Topic entered');

  // Click generate (this calls the real AI)
  await page.click('button:has-text("Сгенерировать")');

  // Wait for AI response (up to 30s)
  try {
    await page.waitForSelector('h1:has-text("Редактирование")', { timeout: 30000 });
    ok('AI generated slides and moved to Step 2');
  } catch {
    await page.screenshot({ path: 'test-screenshots/live/v2-02-gen-timeout.png' });
    fail('AI generation timed out', 'check screenshot');
  }

  await page.screenshot({ path: 'test-screenshots/live/v2-02-slides.png', fullPage: true });

  // Check that slides have real content (not mock)
  const firstTitle = await page.locator('input[type="text"]').first().inputValue();
  const isMock = firstTitle.includes('Пример заголовка') || firstTitle.includes('Ошибка #');
  !isMock ? ok('Slide content is AI-generated: "' + firstTitle.slice(0, 50) + '"') : fail('Content is still mock', firstTitle);

  // Count slides
  const slideInputs = await page.locator('input[type="text"]').count();
  slideInputs >= 5 ? ok(slideInputs + ' slide editors rendered') : fail('Slide count', slideInputs);

  // Go to Step 3 (templates)
  await page.click('button:has-text("Далее")');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'test-screenshots/live/v2-03-templates.png', fullPage: true });

  // Check visual template previews
  const templateBtns = page.locator('button:has([class*="aspect-"])');
  const tplCount = await templateBtns.count();
  tplCount >= 6 ? ok(tplCount + ' visual template cards with previews') : fail('Templates', tplCount);

  // Check reference upload section
  const uploadText = await page.textContent('body');
  uploadText.includes('референс') ? ok('Reference upload section present') : fail('Reference upload', 'not found');

  // Select a template
  await templateBtns.first().click();
  await page.screenshot({ path: 'test-screenshots/live/v2-04-template-selected.png' });
  ok('Template selected');

  // Generate carousel
  await page.click('button:has-text("Сгенерировать карусель")');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'test-screenshots/live/v2-05-generating.png' });

  const progText = await page.textContent('body');
  progText.includes('Nano Banana') || progText.includes('Генерация')
    ? ok('Generation progress with stages') : fail('Progress', 'not found');

  // Wait for completion
  await page.waitForTimeout(12000);
  await page.screenshot({ path: 'test-screenshots/live/v2-06-result.png', fullPage: true });

  // Check result page
  const resultText = await page.textContent('body');

  resultText.includes('Превью слайдов') ? ok('Slide preview section') : fail('Preview', 'not found');
  resultText.includes('Копировать текст') ? ok('Copy text button') : fail('Copy button', 'not found');
  resultText.includes('Скачать текст') ? ok('Download text button') : fail('Download button', 'not found');
  resultText.includes('Google') ? ok('Auth prompt shown') : fail('Auth prompt', 'not found');
  resultText.includes('Создать ещё') ? ok('Create another button') : fail('Create another', 'not found');

  // No more 404 link!
  const brokenLinks = page.locator('a[href="https://www.figma.com/file/example"]');
  (await brokenLinks.count()) === 0 ? ok('No broken Figma links') : fail('Broken links', 'still present');

  // Summary
  console.log('\n' + '═'.repeat(40));
  console.log('  PASSED: ' + passed + ' / ' + (passed + failed));
  if (failed > 0) console.log('  FAILED: ' + failed);
  else console.log('  ALL TESTS PASSED!');
  console.log('═'.repeat(40) + '\n');

  await browser.close();
  process.exit(failed > 0 ? 1 : 0);
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
