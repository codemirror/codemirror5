var tests = [], runOnly = null;

function Failure(why) {this.message = why;}

function test(name, run) {tests.push({name: name, func: run}); return name;}
function testCM(name, run, opts) {
  return test(name, function() {
    var place = document.getElementById("testground"), cm = CodeMirror(place, opts);
    try {run(cm);}
    finally {if (!runOnly) place.removeChild(cm.getWrapperElement());}
  });
}

function runTests(callback) {
  function step(i) {
    if (i == tests.length) return callback("done");
    var test = tests[i];
    if (runOnly != null && runOnly != test.name) return step(i + 1);
    try {test.func(); callback("ok", test.name);}
    catch(e) {
      if (e instanceof Failure)
        callback("fail", test.name, e.message);
      else
        callback("error", test.name, e.toString());
    }
    setTimeout(function(){step(i + 1);}, 20);
  }
  step(0);
}

function label(str, msg) {
  if (msg) return str + " (" + msg + ")";
  return str;
}
function eq(a, b, msg) {
  if (a != b) throw new Failure(label(a + " != " + b, msg));
}
function eqPos(a, b, msg) {
  function str(p) { return "{line:" + p.line + ",ch:" + p.ch + "}"; }
  if (a == b) return;
  if (a == null) throw new Failure(label("comparing null to " + str(b)));
  if (b == null) throw new Failure(label("comparing " + str(a) + " to null"));
  if (a.line != b.line || a.ch != b.ch) throw new Failure(label(str(a) + " != " + str(b), msg));
}
function is(a, msg) {
  if (!a) throw new Failure(label("assertion failed", msg));
}
