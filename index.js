const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const url = 'https://www.google.com/maps/place/Kansas+Overseas+Careers/@19.2319328,72.9733741,17z/data=!3m1!5s0x3be7a53920ba650b:0x9d3242961d2b4f0c!4m8!3m7!1s0x3be7b9000e43d843:0xd14010b801cf2307!8m2!3d19.2319328!4d72.975949!9m1!1b1!16s%2Fg%2F11h68jg5lm?authuser=0&entry=ttu';

const result = 'output.json';
const limit = 10;

// Configure cache path
const cacheDir = path.join(__dirname, '.C:\\Users\\MKT\\AppData\\Local\\Google\\Chrome\\User Data\\Profile 5');

async function run() {
  const launchArgs = [`--user-data-dir=${cacheDir}`];
  const browser = await puppeteer.launch({ headless: true, args: launchArgs });
  const page = await browser.newPage();

  // Define scrape function
  async function scrape(url, limit) {
    await page.goto(url, { waitUntil: 'networkidle2' });
    
    await page.click('button[jsaction="pane.reviewChart.moreReviews"]');
    await page.waitForSelector('div.section-review-content');
    
    let reviews = [];

    while (reviews.length < limit) {
      let elements = await page.$$('div.section-review-content');

      for (let element of elements) {
        if (reviews.length === limit) {
          break;
        }

        let name = await element.$eval('div.section-review-title span', (name) => name.innerText);
        let rating = await element.$eval('span.section-review-stars', (rating) => rating.getAttribute('aria-label'));
        let text = await element.$eval('span.section-review-text', (text) => text.innerText);
        let link = await element.$eval('a.section-review-link', (link) => link.href);

        reviews.push({
          name,
          rating,
          text,
          link,
        });
      }

      await page.evaluate(() => {
        window.scrollBy(0, window.innerHeight);
      });

      await page.waitForTimeout(2000);
    }

    return reviews;
  }

  // Call the function
  scrape(url, limit)
    .then((reviews) => {
      fs.writeFileSync(result, JSON.stringify(reviews, null, 2));
      console.log(`Saved ${reviews.length} reviews to ${result}`);
    })
    .catch((error) => {
      console.error(error);
    })
    .finally(() => {
      browser.close();
    });
}

run();
