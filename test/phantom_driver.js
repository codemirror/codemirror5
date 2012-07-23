var page = require('webpage').create();

page.onError = function (msg, trace) {
  console.log(msg);
};

page.open("http://localhost:3000/test/index.html", function (status) {
  phantom.exit(status == "success" ? 0 : 1);
});
