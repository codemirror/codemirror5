test('meta_id_unique', function () {
  const map = {};
  for (const m of CodeMirror.modeInfo) {
    if (map[m.id]) {
      throw new Failure("Modes \"" + map[m.id] + "\" and \"" + m.name + "\" share the same ID: \"" + m.id + "\"");
    }
    map[m.id] = m.name;
  }
})