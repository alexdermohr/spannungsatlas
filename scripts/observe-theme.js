import puppeteer from 'puppeteer';

const URL = process.argv[2] || 'http://localhost:5173/';

async function run() {
  console.log(`\n=== Observing Theme at ${URL} (Persistence Test) ===`);
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  // Inject a logger that works across navigations
  await page.evaluateOnNewDocument(() => {
    window.__themeLog = [];
    window.__logThemeChange = (event, val) => {
      window.__themeLog.push({
        time: Date.now(),
        event,
        theme: val || document.documentElement.getAttribute('data-theme')
      });
      console.log(`[Theme Mutated] ${event}: ${val}`);
    };

    // Setup MutationObserver BEFORE page loads to catch early overwrites
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.attributeName === 'data-theme') {
          window.__logThemeChange('mutation', document.documentElement.getAttribute('data-theme'));
        }
      }
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  });

  page.on('console', msg => {
    if (msg.text().includes('[Theme Mutated]')) {
      console.log(`Browser Console: ${msg.text()}`);
    }
  });

  await page.goto(URL, { waitUntil: 'networkidle0' });

  async function getReadings(label) {
    const data = await page.evaluate(() => {
      const theme = document.documentElement.getAttribute('data-theme');
      const comp = window.getComputedStyle(document.body);
      const bg = comp.getPropertyValue('background-color');
      const fg = comp.getPropertyValue('color');
      return { theme, bg, fg };
    });
    console.log(`[${label}] data-theme: ${data.theme}, bg: ${data.bg}, color: ${data.fg}`);
    return data;
  }

  await getReadings('Initial Load 1');

  // Test Dark Click
  console.log('\n--- Setting Dark ---');
  await page.evaluate(() => {
    const btn = document.querySelector('button[aria-label="Dunkel"]');
    if (btn) btn.click();
  });

  await getReadings('Immediate post-click');

  // Reload
  console.log('\n--- Reloading Page ---');
  await page.reload({ waitUntil: 'networkidle0' });

  await getReadings('Initial Load 2 (After Reload)');

  console.log('\n--- Logs ---');
  const logs = await page.evaluate(() => window.__themeLog);
  console.log(logs);

  await browser.close();
}

run().catch(console.error);
