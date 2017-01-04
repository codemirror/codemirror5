var blint = require("blint");

["mode", "lib", "addon", "keymap"].forEach(function(dir) {
  blint.checkDir(dir, {
    browser: true,
    allowedGlobals: ["CodeMirror", "define", "test", "requirejs"],
    ecmaVersion: 5
  });
});

["src"].forEach(function(dir) {
  blint.checkDir(dir, {
    browser: true,
    ecmaVersion: 6,
    semicolons: false
  });
});

module.exports = {ok: blint.success()};
