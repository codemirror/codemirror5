/*
 Simple linter, based on the Acorn [1] parser module

 All of the existing linters either cramp my style or have huge
 dependencies (Closure). So here's a very simple, non-invasive one
 that only spots

  - missing semicolons and trailing commas
  - variables or properties that are reserved words
  - assigning to a variable you didn't declare

 [1]: https://github.com/marijnh/acorn/
*/

var fs = require("fs"), acorn = require("./acorn.js"), walk = require("./walk.js");

var scopePasser = walk.make({
  ScopeBody: function(node, prev, c) { c(node, node.scope); }
});
var hop = Object.prototype.hasOwnProperty;

function checkFile(fileName) {
  var file = fs.readFileSync(fileName, "utf8");
  var badChar = file.match(/[\x00-\x08\x0b\x0c\x0e-\x19\uFEFF]/);
  if (badChar)
    fail("Undesirable character " + badChar[0].charCodeAt(0) + " at position " + badChar.index,
         {source: fileName});

  try {
    var parsed = acorn.parse(file, {
      locations: true,
      ecmaVersion: 3,
      strictSemicolons: true,
      forbidReserved: true,
      sourceFile: fileName
    });
  } catch (e) {
    fail(e.message, {source: fileName});
    return;
  }

  walk.simple(parsed, {
    ScopeBody: function(node, scope) {
      node.scope = scope;
    }
  }, walk.scopeVisitor, {vars: Object.create(null)});

  var ignoredGlobals = Object.create(null);

  function inScope(name, scope) {
    for (var cur = scope; cur; cur = cur.prev)
      if (hop.call(cur.vars, name)) return true;
  }
  function checkLHS(node, scope) {
    if (node.type == "Identifier" && !hop.call(ignoredGlobals, node.name) &&
        !inScope(node.name, scope)) {
      ignoredGlobals[node.name] = true;
      fail("Assignment to global variable", node.loc);
    }
  }

  walk.simple(parsed, {
    UpdateExpression: function(node, scope) {checkLHS(node.argument, scope);},
    AssignmentExpression: function(node, scope) {checkLHS(node.left, scope);}
  }, scopePasser);
}

var failed = false;
function fail(msg, pos) {
  if (pos.start) msg += " (" + pos.start.line + ":" + pos.start.column + ")";
  console.log(pos.source.match(/[^\/]+$/)[0] + ": " + msg);
  failed = true;
}

function checkDir(dir) {
  fs.readdirSync(dir).forEach(function(file) {
    var fname = dir + "/" + file;
    if (/\.js$/.test(file)) checkFile(fname);
    else if (fs.lstatSync(fname).isDirectory()) checkDir(fname);
  });
}

exports.checkDir = checkDir;
exports.checkFile = checkFile;
exports.success = function() { return !failed; };
