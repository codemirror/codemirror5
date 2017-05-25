diff_viewer = {};
diff_viewer.instance = {};
diff_viewer.diff = function(diff_container, leftText, rightText) {
  require([
      '../../lib/codemirror.js',
      './merge.js'
    ],
    function(Codemirror) {
      if(document.getElementsByClassName(diff_container)[0].children.length > 0)  {
        diff_viewer.instance[diff_container].editor().setValue(leftText);
        diff_viewer.instance[diff_container].rightOriginal().getDoc().setValue(rightText);
      }
      else {
        var diff_view_instance = Codemirror.MergeView(
          document.getElementsByClassName(diff_container)[0], {
            value: leftText,
            readOnly: true,
            origLeft: null,
            orig: rightText,
            lineNumbers: true,
            highlightDifferences: true,
            connect: null,
            mode:"text",
            collapseIdentical: false
          }
        );
        diff_viewer.instance[diff_container] = diff_view_instance;
      }

      diff_viewer.refresh(diff_container);
    }
  );
};

diff_viewer.refresh = function (instance) {
  setTimeout(function() {
    diff_viewer.instance[instance].edit.refresh();
    diff_viewer.instance[instance].right.orig.refresh();
  }, 200);
};
