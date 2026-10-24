const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', err => errors.push(err.message));

  console.log('Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 15000 });

  // Check Header Brand Name
  const brandText = await page.textContent('#main-sticky-header button:first-child');
  console.log('Header Brand Text:', brandText.trim());

  // Check Header controls exist
  const darkModeBtn = await page.$('#top-dark-mode-toggle');
  const langBtn = await page.$('#top-language-switcher');
  const profileBtn = await page.$('#open-profile-drawer-btn');
  console.log('Controls present:', { darkMode: !!darkModeBtn, lang: !!langBtn, profile: !!profileBtn });

  // Take screenshot in Light Mode
  await page.screenshot({ path: 'light-mode-header.png', fullPage: false });
  console.log('Saved light-mode-header.png');

  // Toggle Dark Mode
  await darkModeBtn.click();
  await page.waitForTimeout(400);

  // Check data-color-mode
  const colorMode = await page.getAttribute('html', 'data-color-mode');
  console.log('HTML data-color-mode after toggle:', colorMode);

  // Take screenshot in Dark Mode
  await page.screenshot({ path: 'dark-mode-header.png', fullPage: false });
  console.log('Saved dark-mode-header.png');

  // Navigate to Community
  const commNav = await page.getByRole('button', { name: /مجتمع الآباء|Parents Community/i }).first();
  if (commNav) {
    await commNav.click();
    await page.waitForTimeout(600);
    const filterCard = await page.$('#community-topic-filter-card');
    const composerCard = await page.$('#community-post-composer-accordion');
    console.log('Community collapsible cards present:', { filterCard: !!filterCard, composerCard: !!composerCard });
    await page.screenshot({ path: 'community-dark.png', fullPage: false });
  }

  // Toggle Language to English
  const topLangBtn = await page.$('#top-language-switcher');
  if (topLangBtn) {
    await topLangBtn.click();
    await page.waitForTimeout(400);
    const brandTextEn = await page.textContent('#main-sticky-header button:first-child');
    console.log('Header Brand Text in English:', brandTextEn.trim());
    await page.screenshot({ path: 'english-dark.png', fullPage: false });
  }

  console.log('Errors encountered:', errors.length);
  if (errors.length > 0) console.log('Error details:', errors.slice(0, 5));

  await browser.close();
})();
