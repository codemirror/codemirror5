(function() {
  namespace = "multi_";

  function hasSelections(cm) {
    var sels = cm.listSelections();
    var given = (arguments.length - 1) / 4;
    if (sels.length != given)
      throw new Failure("expected " + given + " selections, found " + sels.length);
    for (var i = 0, p = 1; i < given; i++, p += 4) {
      var anchor = Pos(arguments[p], arguments[p + 1]);
      var head = Pos(arguments[p + 2], arguments[p + 3]);
      eqPos(sels[i].anchor, anchor, "anchor of selection " + i);
      eqPos(sels[i].head, head, "head of selection " + i);
    }
  }

  testCM("replaceSelection", function(cm) {
    var selections = [{anchor: Pos(0, 0), head: Pos(0, 1)},
                      {anchor: Pos(0, 2), head: Pos(0, 3)},
                      {anchor: Pos(0, 4), head: Pos(0, 5)},
                      {anchor: Pos(2, 1), head: Pos(2, 4)},
                      {anchor: Pos(2, 5), head: Pos(2, 6)}];
    var val = "123456\n123456\n123456";
    cm.setValue(val);
    cm.setSelections(selections);
    cm.replaceSelection("ab", "around");
    eq(cm.getValue(), "ab2ab4ab6\n123456\n1ab5ab");
    hasSelections(cm, 0, 0, 0, 2,
                  0, 3, 0, 5,
                  0, 6, 0, 8,
                  2, 1, 2, 3,
                  2, 4, 2, 6);
    cm.setValue(val);
    cm.setSelections(selections);
    cm.replaceSelection("", "around");
    eq(cm.getValue(), "246\n123456\n15");
    hasSelections(cm, 0, 0, 0, 0,
                  0, 1, 0, 1,
                  0, 2, 0, 2,
                  2, 1, 2, 1,
                  2, 2, 2, 2);
    cm.setValue(val);
    cm.setSelections(selections);
    cm.replaceSelection("X\nY\nZ", "around");
    hasSelections(cm, 0, 0, 2, 1,
                  2, 2, 4, 1,
                  4, 2, 6, 1,
                  8, 1, 10, 1,
                  10, 2, 12, 1);
    cm.replaceSelection("a", "around");
    hasSelections(cm, 0, 0, 0, 1,
                  0, 2, 0, 3,
                  0, 4, 0, 5,
                  2, 1, 2, 2,
                  2, 3, 2, 4);
    cm.replaceSelection("xy", "start");
    hasSelections(cm, 0, 0, 0, 0,
                  0, 3, 0, 3,
                  0, 6, 0, 6,
                  2, 1, 2, 1,
                  2, 4, 2, 4);
    cm.replaceSelection("z\nf");
    hasSelections(cm, 1, 1, 1, 1,
                  2, 1, 2, 1,
                  3, 1, 3, 1,
                  6, 1, 6, 1,
                  7, 1, 7, 1);
    eq(cm.getValue(), "z\nfxy2z\nfxy4z\nfxy6\n123456\n1z\nfxy5z\nfxy");
  });

  function select(cm) {
    var sels = [];
    for (var i = 1; i < arguments.length; i++) {
      var arg = arguments[i];
      if (arg.head) sels.push(arg);
      else sels.push({head: arg, anchor: arg});
    }
    cm.setSelections(sels);
  }

  testCM("indentSelection", function(cm) {
    select(cm, Pos(0, 1), Pos(1, 1));
    cm.indentSelection(4);
    eq(cm.getValue(), "    foo\n    bar\nbaz");

    select(cm, Pos(0, 2), Pos(0, 3), Pos(0, 4));
    cm.indentSelection(-2);
    eq(cm.getValue(), "  foo\n    bar\nbaz");

    select(cm, {anchor: Pos(0, 0), head: Pos(1, 2)},
           {anchor: Pos(1, 3), head: Pos(2, 0)});
    cm.indentSelection(-2);
    eq(cm.getValue(), "foo\n  bar\nbaz");
  }, {value: "foo\nbar\nbaz"});

  testCM("killLine", function(cm) {
    select(cm, Pos(0, 1), Pos(0, 2), Pos(1, 1));
    cm.execCommand("killLine");
    eq(cm.getValue(), "f\nb\nbaz");
    cm.execCommand("killLine");
    eq(cm.getValue(), "fbbaz");
    cm.setValue("foo\nbar\nbaz");
    select(cm, Pos(0, 1), {anchor: Pos(0, 2), head: Pos(2, 1)});
    cm.execCommand("killLine");
    eq(cm.getValue(), "faz");
  }, {value: "foo\nbar\nbaz"});

  testCM("deleteLine", function(cm) {
    select(cm, Pos(0, 0),
           {head: Pos(0, 1), anchor: Pos(2, 0)},
           Pos(4, 0));
    cm.execCommand("deleteLine");
    eq(cm.getValue(), "4\n6\n7");
    select(cm, Pos(2, 1));
    cm.execCommand("deleteLine");
    eq(cm.getValue(), "4\n6\n");
  }, {value: "1\n2\n3\n4\n5\n6\n7"});

  testCM("deleteH", function(cm) {
    select(cm, Pos(0, 4), {anchor: Pos(1, 4), head: Pos(1, 5)});
    cm.execCommand("delWordAfter");
    eq(cm.getValue(), "foo bar baz\nabc ef ghi\n");
    cm.execCommand("delWordAfter");
    eq(cm.getValue(), "foo  baz\nabc  ghi\n");
    cm.execCommand("delCharBefore");
    cm.execCommand("delCharBefore");
    eq(cm.getValue(), "fo baz\nab ghi\n");
    select(cm, Pos(0, 3), Pos(0, 4), Pos(0, 5));
    cm.execCommand("delWordAfter");
    eq(cm.getValue(), "fo \nab ghi\n");
  }, {value: "foo bar baz\nabc def ghi\n"});

  testCM("goLineStart", function(cm) {
    select(cm, Pos(0, 2), Pos(0, 3), Pos(1, 1));
    cm.execCommand("goLineStart");
    hasSelections(cm, 0, 0, 0, 0,
                  1, 0, 1, 0);
    select(cm, Pos(1, 1), Pos(0, 1));
    cm.setExtending(true);
    cm.execCommand("goLineStart");
    hasSelections(cm, 0, 1, 0, 0,
                  1, 1, 1, 0);
  }, {value: "foo\nbar\nbaz"});

  
})();
