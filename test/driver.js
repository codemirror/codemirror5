var tests = [], debug = null;

function Failure(why) {this.message = why;}

function test(name, run, expectedFail) {
  tests.push({name: name, func: run, expectedFail: expectedFail});
  return name;
}
function testCM(name, run, opts, expectedFail) {
  return test(name, function() {
    var place = document.getElementById("testground"), cm = CodeMirror(place, opts);
    if (debug) place.style.visibility = "";
    try {run(cm);}
    finally {if (!debug) place.removeChild(cm.getWrapperElement());}
  }, expectedFail);
}

function runTests(callback) {
  function step(i) {
    if (i == tests.length) return callback("done");
    var test = tests[i], expFail = test.expectedFail;
    if (debug != null && debug != test.name) return step(i + 1);
    try {
      test.func();
      if (expFail) callback("fail", test.name, "was expected to fail, but succeeded");
      else callback("ok", test.name);
    } catch(e) {
      if (expFail) callback("expected", test.name);
      else if (e instanceof Failure) callback("fail", test.name, e.message);
      else callback("error", test.name, e.toString());
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
