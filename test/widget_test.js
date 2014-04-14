(function() {
  "use strict";

  namespace = "widget_";

  function makeLineWidget(cm, line, height, options) {
    var widgetEl = document.createElement('div');
    widgetEl.style.height = height + 'px';
    widgetEl.textContent = 'dummy text';

    return {
      el : widgetEl,
      widget : cm.addLineWidget(line, widgetEl, options || {})
    };
  }

  function testWidgetsAffectDocumentHeight(tagline, docLines, widgetLine, viewportLine) {
    var initialHeight = 100;
    var changedHeight = 150;

    testCM('lineWidgetDocHeight_' + tagline, function(cm) {
      var startingDocHeight = cm.getScrollInfo().height;

      if (viewportLine != null) {
	cm.scrollIntoView({ line : viewportLine, ch: 0 });
      }

      var widgetInfo = makeLineWidget(cm, widgetLine, initialHeight);
      eq(startingDocHeight + initialHeight, cm.getScrollInfo().height, 'addLineWidget(): widget height should be added to document height.');

      widgetInfo.el.style.height = changedHeight + 'px';
      widgetInfo.widget.changed();
      eq(startingDocHeight + changedHeight, cm.getScrollInfo().height, 'widget.changed(): widget height should be updated in document height.');

      widgetInfo.widget.clear();
      eq(startingDocHeight, cm.getScrollInfo().height, 'widget.clear(): widget height should be removed from document height.');
    }, {
      value : new Array(docLines + 1).join('blah\n')
    })
  }

  testWidgetsAffectDocumentHeight('shortFile_WidgetAtTop', 50, 0);
  testWidgetsAffectDocumentHeight('shortFile_WidgetAtBottom', 50, 49);

  testWidgetsAffectDocumentHeight('longFile_WidgetAtTop', 1000, 1);
  testWidgetsAffectDocumentHeight('longFile_WidgetAtMiddle', 1000, 500);
  testWidgetsAffectDocumentHeight('longFile_WidgetAtBottom', 1000, 1000);

  testWidgetsAffectDocumentHeight('longFile_WidgetAtTop_viewportBottom', 1000, 0, 999);
  testWidgetsAffectDocumentHeight('longFile_WidgetAtMiddle_viewportBottom', 1000, 499, 999);
  testWidgetsAffectDocumentHeight('longFile_WidgetAtBottom_viewportBottom', 1000, 999, 999);

})();
