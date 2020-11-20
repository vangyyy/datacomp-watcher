const puppeteer = require('puppeteer');
const nodemailer = require('nodemailer');
const moment = require('moment');

const items = require('./items.json');

require('dotenv').config();

puppeteer.launch({ headless: true }).then(async (browser) => {
  console.time('Duration');

  await Promise.all(
    items.map(async (item) => {
      const available = await checkAvailability(browser, item.name, item.url);
      const time = moment().format('HH:mm:ss');

      console.log(`[${time}] ${item.name}: ${available ? '✔️' : '✖️'}`);

      if (available) {
        await notify(item.notify, item.name, item.url);
      }
    })
  );

  await browser.close();
  console.timeEnd('Duration');
});

async function checkAvailability(browser, name, url) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto(url, { timeout: 3000000 });

  await page.screenshot({ path: `screenshots/${name}.png`, fullPage: true });

  return !page.evaluate(() => window.find('AKTUÁLNE NEDOSTUPNÉ.'));
}

async function notify(mailList, itemName, url) {
  let transporter = nodemailer.createTransport({
    host: 'smtp.centrum.sk',
    port: 587,
    secure: false,
    auth: {
      user: process.env.MAIL_ADDRESS,
      pass: process.env.MAIL_PASS,
    },
  });

  try {
    await transporter.sendMail({
      from: process.env.MAIL_ADDRESS,
      to: mailList,
      subject: `${itemName} is available!`,
      text: url,
    });
  } catch (err) {
    console.log(err);
  }
}
