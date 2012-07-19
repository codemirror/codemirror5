var tests = [], runOnly = null;

function Failure(why) {this.message = why;}

function test(name, run) {tests.push({name: name, func: run}); return name;}
function testCM(name, run, opts) {
  return test(name, function() {
    var place = document.getElementById("testground"), cm = CodeMirror(place, opts);
    try {run(cm);}
    finally {place.removeChild(cm.getWrapperElement());}
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

function eq(a, b, msg) {
  if (a != b) throw new Failure(a + " != " + b + (msg ? " (" + msg + ")" : ""));
}
function eqPos(a, b, msg) {
  if (a == b) return;
  if (a == null || b == null) throw new Failure("comparing point to null");
  eq(a.line, b.line, msg);
  eq(a.ch, b.ch, msg);
}
function is(a, msg) {
  if (!a) throw new Failure("assertion failed" + (msg ? " (" + msg + ")" : ""));
}
