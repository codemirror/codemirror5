/*
 Simple linter, based on UglifyJS's [1] parse-js module

 All of the existing linters either cramp my style or have huge
 dependencies (Closure). So here's a very simple, non-invasive one
 that only spots

  - missing semicolons and trailing commas
  - variables or properties that are reserved words
  - assigning to a variable you didn't declare

 [1]: https://github.com/mishoo/UglifyJS/
*/

var fs = require("fs"), parse_js = require("./parse-js").parse;

var reserved = {};
"break case catch continue debugger default delete do else false finally for function if in\
 instanceof new null return switch throw true try typeof var void while with abstract enum\
 int short boolean export interface static byte extends long super char final native\
 synchonized class float package throws const goto private transient implements protected\
 volatile double import public const".split(" ").forEach(function(word) { reserved[word] = true; });

function checkVariable(scope, name, pos) {
  while (scope) {
    if (scope.cur.hasOwnProperty(name)) return;
    scope = scope.prev;
  }
  fail("Accidental global: " + name, pos);
}
function checkProperty(name, pos) {
  if (reserved.hasOwnProperty(name)) {
    fail("Using a keyword or reserved word as a property: " + name, pos);
  }
}

function walk(ast, scope) {
  var tp = ast[0];
  if (typeof tp != "string") tp = tp.name;
  function sub(ast) { if (ast) walk(ast, scope); }
  function subn(array) { if (array) array.forEach(sub); }
  if (tp == "block" || tp == "splice" || tp == "toplevel" || tp == "array") {
    subn(ast[1]);
  } else if (tp == "var" || tp == "const") {
    ast[1].forEach(function(def) { scope.cur[def[0]] = true; if (def[1]) sub(def[1]); });
  } else if (tp == "try") {
    subn(ast[1]);
    if (ast[2]) { scope.cur[ast[2][0]] = true; subn(ast[2][1]); }
    subn(ast[3]);
  } else if (tp == "throw" || tp == "return" || tp == "dot" || tp == "stat") {
    sub(ast[1]);
  } else if (tp == "dot") {
    sub(ast[1]);
    checkProperty(ast[2], ast[0]);
  } else if (tp == "new" || tp == "call") {
    sub(ast[1]); subn(ast[2]);
  } else if (tp == "switch") {
    sub(ast[1]);
    ast[2].forEach(function(part) { sub(part[0]); subn(part[1]); });
  } else if (tp == "conditional" || tp == "if" || tp == "for" || tp == "for-in") {
    sub(ast[1]); sub(ast[2]); sub(ast[3]); sub(ast[4]);
  } else if (tp == "assign") {
    if (ast[2][0].name == "name") checkVariable(scope, ast[2][1], ast[2][0]);
    sub(ast[2]); sub(ast[3]);
  } else if (tp == "function" || tp == "defun") {
    if (tp == "defun") scope.cur[ast[1]] = true;
    var nscope = {prev: scope, cur: {}};
    ast[2].forEach(function(arg) { nscope.cur[arg] = true; });
    ast[3].forEach(function(ast) { walk(ast, nscope); });
  } else if (tp == "while" || tp == "do" || tp == "sub" || tp == "with") {
    sub(ast[1]); sub(ast[2]);
  } else if (tp == "binary" || tp == "unary-prefix" || tp == "unary-postfix" || tp == "label") {
    if (/\+\+|--/.test(ast[1]) && ast[2][0].name == "name") checkVariable(scope, ast[2][1], ast[2][0]);
    sub(ast[2]); sub(ast[3]);
  } else if (tp == "object") {
    ast[1].forEach(function(prop) {
      if (prop.type != "string") checkProperty(prop[0], ast[0]);
      sub(prop[1]); sub(prop[2]);
    });
  } else if (tp == "seq") {
    subn(ast.slice(1));
  } else if (tp == "name") {
    if (reserved.hasOwnProperty(ast[1]) && !/^(?:null|true|false)$/.test(ast[1]))
      fail("Using reserved word as variable name: " + ast[1], ast[0]);
  }
}

var failed = false, curFile;
function fail(msg, pos) {
  if (typeof pos == "object") pos = pos.start.line + 1;
  console.log(curFile + ": " + msg + (typeof pos == "number" ? " (" + pos + ")" : ""));
  failed = true;
}

function checkFile(fileName) {
  curFile = fileName.match(/[^\/+]*\.js$/)[0];
  var file = fs.readFileSync(fileName, "utf8");
  var badChar = file.match(/[\x00-\x08\x0b\x0c\x0e-\x19\uFEFF]/);
  if (badChar) fail("Undesirable character " + badChar[0].charCodeAt(0) + " at position " + badChar.index);
  if (/^#!/.test(file)) file = file.slice(file.indexOf("\n") + 1);
  try {
    var parsed = parse_js(file, true, true);
  } catch(e) {
    fail(e.message, e.line);
    return;
  }
  walk(parsed, {prev: null, cur: {}});
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
