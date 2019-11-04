#!/usr/bin/env node

var ok = require("./lint").ok;

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
  const browser = await puppeteer.launch()
  const page = await browser.newPage()
  await page.goto('http://localhost:3000/test/index.html')
  page.on('dialog', async dialog => {
    console.log(dialog.message())
    await dialog.dismiss()
  })
  var ret1 = false;
  while(1){
    ret1 = await page.evaluate(() => {
      var output = document.getElementById('status');
      if (!output) {
        return false;
      }
	return (/^(\d+ failures?|all passed)/i).test(output.innerText);
    })
  if(ret1 === true) { break}
  }
  var failed = await page.evaluate(function () { return window.failed; });
  var output = await page.evaluate(function () {
    return document.getElementById('output').innerText + "\n" +
    document.getElementById('status').innerText;
  });
  console.log(output);
  process.exit(failed > 0 ? 1 : 0);
  await browser.close()
})());
