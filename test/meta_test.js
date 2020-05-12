test('meta_id_unique', function () {
  const map = {};
  for (const m of CodeMirror.modeInfo) {
    if (map[m.id]) {
      throw new Failure("Modes \"" + map[m.id] + "\" and \"" + m.name + "\" share the same ID in meta.js: \"" + m.id + "\"");
    }
    map[m.id] = m.name;
  }
});

test('meta_id_mandatory', function () {
  for (const m of CodeMirror.modeInfo) {
    if (!m.id) throw new Failure("Mode \"" + m.name + "\" must have an id in meta.js");
  }
});

test('meta_id_format', function () {
  const formatRegexp = /^[a-z0-9]{1,4}$/
  for (const m of CodeMirror.modeInfo) {
    if (!formatRegexp.test(m.id)) throw new Failure("Mode \"" + m.name + "\" has an invalid id ("+ m.id +
      "). It should be composed of 1 to 4 alphanumeric characters");
  }
});