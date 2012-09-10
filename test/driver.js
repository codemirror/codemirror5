var tests = [], debug = null, debugUsed = new Array(), allNames = [];

function Failure(why) {this.message = why;}

function indexOf(collection, elt) {
  if (collection.indexOf) return collection.indexOf(elt);
  for (var i = 0, e = collection.length; i < e; ++i)
    if (collection[i] == elt) return i;
  return -1;
}

function test(name, run, expectedFail) {
  // Force unique names
  var originalName = name;
  var i = 2; // Second function would be NAME_2
  while (indexOf(allNames, name) !== -1){
    name = originalName + "_" + i;
    i++;
  }
  allNames.push(name);
  // Add test
  tests.push({name: name, func: run, expectedFail: expectedFail});
  return name;
}
function testCM(name, run, opts, expectedFail) {
  return test("core_" + name, function() {
    var place = document.getElementById("testground"), cm = CodeMirror(place, opts);
    var successful = false;
    try {
      run(cm);
      successful = true;
    } finally {
      if ((debug && !successful) || verbose) {
        place.style.visibility = "";
      } else {
        place.removeChild(cm.getWrapperElement());
      }
    }
  }, expectedFail);
}

function runTests(callback) {
  if (debug) {
    if (indexOf(debug, "verbose") === 0) {
      verbose = true;
      debug.splice(0, 1);
    }
    if (debug.length < 1) {
      debug = null;
    } else {
      if (totalTests > debug.length) {
        totalTests = debug.length;
      }
    }
  }
  var totalTime = 0;
  function step(i) {
    if (i === tests.length){
      running = false;
      return callback("done");
    }
    var test = tests[i], expFail = test.expectedFail, startTime = +new Date;
    if (debug !== null) {
      var debugIndex = indexOf(debug, test.name);
      if (debugIndex !== -1) {
        // Remove from array for reporting incorrect tests later
        debug.splice(debugIndex, 1);
      } else {
        var wildcardName = test.name.split("_").shift() + "_*";
        debugIndex = indexOf(debug, wildcardName);
        if (debugIndex !== -1) {
          // Remove from array for reporting incorrect tests later
          debug.splice(debugIndex, 1);
          debugUsed.push(wildcardName);
        } else {
          debugIndex = indexOf(debugUsed, wildcardName);
          if (debugIndex !== -1) {
            totalTests++;
          } else {
            return step(i + 1);
          }
        }
      }
    }
    try {
      var message = test.func();
      if (expFail) callback("fail", test.name, message);
      else callback("ok", test.name, message);
    } catch(e) {
      if (expFail) callback("expected", test.name);
      else if (e instanceof Failure) callback("fail", test.name, e.message);
      else {
        var pos = /\bat .*?([^\/:]+):(\d+):/.exec(e.stack);
        callback("error", test.name, e.toString() + (pos ? " (" + pos[1] + ":" + pos[2] + ")" : ""));
      }
    }
    if (!quit) { // Run next test
      var delay = 0;
      totalTime += (+new Date) - startTime;
      if (totalTime > 500){
        totalTime = 0;
        delay = 50;
      }
      setTimeout(function(){step(i + 1);}, delay);
    } else { // Quit tests
      running = false;
      return null;
    }
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
