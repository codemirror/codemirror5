var blint = require("blint");

["mode", "lib", "addon", "keymap"].forEach(function(dir) {
  blint.checkDir(dir, {
    browser: true,
    allowedGlobals: ["CodeMirror", "define", "test", "requirejs", "globalThis", "WeakSet"],
    ecmaVersion: 5,
    tabs: dir == "lib"
  });
});

["src"].forEach(function(dir) {
  blint.checkDir(dir, {
    browser: true,
    allowedGlobals: ["WeakSet"],
    ecmaVersion: 6,
    semicolons: false
  });
});

module.exports = {ok: blint.success()};
