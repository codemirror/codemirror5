#!/usr/bin/env node

var lint = require("./lint");

var files = new (require('node-static').Server)();

var server = require('http').createServer(function (req, res) {
  req.addListener('end', function () {
    files.serve(req, res, function (err/*, result */) {
      if (err) {
        console.error(err);
        process.exit(1);
      }
    });
  }).resume();
}).addListener('error', function (err) {
  throw err;
}).listen(3000,(async () => {
  const puppeteer = require('puppeteer');
  const browser = await puppeteer.launch({args: ["--no-sandbox", "--disable-setuid-sandbox"]})
  const page = await browser.newPage()
  page.on('console', msg => console.log("console:", msg.text()))
  page.on('dialog', async dialog => {
    console.log(dialog.message())
    await dialog.dismiss()
  })
  page.evaluateOnNewDocument(() => window.automatedTests = true)
  await page.goto('http://localhost:3000/test/index.html#' + (process.argv[2] || ""))
  while(1) {
    if (await page.evaluate(() => window.done)) break
    await sleep(200)
  }
  let [failed, errors] = await page.evaluate(() => [window.failed, window.errored])
  for (let error of errors) console.log(error)
  console.log(await page.evaluate(() => document.getElementById('output').innerText + "\n" +
                                          document.getElementById('status').innerText))
  process.exit(failed > 0 || errors.length || !lint.ok ? 1 : 0)
  await browser.close()
})())

function sleep(n) { return new Promise(acc => setTimeout(acc, n)) }
