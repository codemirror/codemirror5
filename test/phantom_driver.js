var page = require('webpage').create();

var errors = false;

page.onError = function (msg, trace) {
  errors = true;
  console.log(msg);
};

page.open("http://localhost:3000/test/index.html", function (status) {
  phantom.exit(status == "success" && !errors ? 0 : 1);
});
