function waitForStyles() {
  for (var i = 0; i < document.styleSheets.length; i++)
    if (/googleapis/.test(document.styleSheets[i].href))
      return document.body.className += " droid";
  setTimeout(waitForStyles, 100);
}
setTimeout(function() {
  if (/AppleWebKit/.test(navigator.userAgent) && /iP[oa]d|iPhone/.test(navigator.userAgent)) return;
  var link = document.createElement("LINK");
  link.type = "text/css";
  link.rel = "stylesheet";
  link.href = "http://fonts.googleapis.com/css?family=Droid+Sans|Droid+Sans:bold";
  document.documentElement.getElementsByTagName("HEAD")[0].appendChild(link);
  waitForStyles();
}, 10);
