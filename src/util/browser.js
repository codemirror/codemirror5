// Kludges for bugs and behavior differences that can't be feature
// detected are enabled based on userAgent etc sniffing.
var userAgent = navigator.userAgent;
var platform = navigator.platform;

export var gecko = /gecko\/\d/i.test(userAgent);
var ie_upto10 = /MSIE \d/.test(userAgent);
var ie_11up = /Trident\/(?:[7-9]|\d{2,})\..*rv:(\d+)/.exec(userAgent);
export var ie = ie_upto10 || ie_11up;
export var ie_version = ie && (ie_upto10 ? document.documentMode || 6 : ie_11up[1]);
export var webkit = /WebKit\//.test(userAgent);
var qtwebkit = webkit && /Qt\/\d+\.\d+/.test(userAgent);
export var chrome = /Chrome\//.test(userAgent);
export var presto = /Opera\//.test(userAgent);
export var safari = /Apple Computer/.test(navigator.vendor);
export var mac_geMountainLion = /Mac OS X 1\d\D([8-9]|\d\d)\D/.test(userAgent);
export var phantom = /PhantomJS/.test(userAgent);

export var ios = /AppleWebKit/.test(userAgent) && /Mobile\/\w+/.test(userAgent);
// This is woefully incomplete. Suggestions for alternative methods welcome.
export var mobile = ios || /Android|webOS|BlackBerry|Opera Mini|Opera Mobi|IEMobile/i.test(userAgent);
export var mac = ios || /Mac/.test(platform);
export var chromeOS = /\bCrOS\b/.test(userAgent);
export var windows = /win/i.test(platform);

var presto_version = presto && userAgent.match(/Version\/(\d*\.\d*)/);
if (presto_version) presto_version = Number(presto_version[1]);
if (presto_version && presto_version >= 15) { presto = false; webkit = true; }
// Some browsers use the wrong event properties to signal cmd/ctrl on OS X
export var flipCtrlCmd = mac && (qtwebkit || presto && (presto_version == null || presto_version < 12.11));
export var captureRightClick = gecko || (ie && ie_version >= 9);
