(function() {
  "use strict";

  namespace = "widget_";

  function makeLineWidget(cm, height) {
    return function(line) {
      var widgetEl = document.createElement('div');
      widgetEl.style.height = height + 'px';
      widgetEl.textContent = 'dummy text';

      return {
        el : widgetEl,
        widget : cm.addLineWidget(line, widgetEl, {})
      };
    }
  }

  function each(arr, fn) {
    for(var i = 0; i < arr.length; i++) fn(arr[i], i, arr);
  }

  function testWidgetsAffectDocumentHeight(tagline, options) {
    var initialHeight = 100;
    var changedHeight = 150;

    var docLines = options.linesInDoc;
    var widgetAtLines = options.widgetAtLines;
    var startingViewportLine = options.startingViewportLine;
    var endingViewportLine = options.endingViewportLine;

    testCM('lineWidgetDocHeight_' + tagline, function(cm) {
      var startingDocHeight = cm.getScrollInfo().height;

      if (startingViewportLine != null) {
	      cm.scrollIntoView({ line : startingViewportLine, ch: 0 });
      }

      var widgetInfos = widgetAtLines.map(makeLineWidget(cm, initialHeight));
      var expectedHeightAfterAdd = startingDocHeight + (widgetInfos.length * initialHeight);
      eq(expectedHeightAfterAdd, cm.getScrollInfo().height, 'addLineWidget(): widget height should be added to document height.');

      each(widgetInfos, function(widgetInfo) {
        widgetInfo.el.style.height = changedHeight + 'px';
        widgetInfo.widget.changed();
      });
      var expectedHeightAfterChanged = startingDocHeight + (widgetInfos.length * changedHeight);
      eq(expectedHeightAfterChanged, cm.getScrollInfo().height, 'widget.changed(): widget height should be updated in document height.');

      if (endingViewportLine != null) {
        cm.scrollIntoView({ line : endingViewportLine, ch: 0 });
        eq(expectedHeightAfterChanged, cm.getScrollInfo().height, 'Scrolling should have no effect on the document height.');
      }

      each(widgetInfos, function(widgetInfo) {
        widgetInfo.widget.clear();
      });
      eq(startingDocHeight, cm.getScrollInfo().height, 'widget.clear(): widget height should be removed from document height.');
    }, {
      lineNumbers:true,
      value : new Array(docLines + 1).join('blah\n')
    })
  }

  testWidgetsAffectDocumentHeight('shortFile_WidgetAtTop', {
    linesInDoc : 50, 
    widgetAtLines : [0]
  });
  testWidgetsAffectDocumentHeight('shortFile_WidgetAtBottom', {
    linesInDoc : 50, 
    widgetAtLines : [49]
  });

  testWidgetsAffectDocumentHeight('longFile_WidgetAtTop', {
    linesInDoc : 1000, 
    widgetAtLines : [1]
  });
  testWidgetsAffectDocumentHeight('longFile_WidgetAtMiddle', {
    linesInDoc : 1000, 
    widgetAtLines : [500]
  });
  testWidgetsAffectDocumentHeight('longFile_WidgetAtBottom', {
    linesInDoc : 1000, 
    widgetAtLines : [1000]
  });

  testWidgetsAffectDocumentHeight('longFile_WidgetAtTop_viewportBottom', {
    linesInDoc : 1000, 
    widgetAtLines : [0],
    startingViewportLine : 999
  });
  testWidgetsAffectDocumentHeight('longFile_WidgetAtMiddle_viewportBottom', {
    linesInDoc : 1000, 
    widgetAtLines : [499],
    startingViewportLine : 999
  });
  testWidgetsAffectDocumentHeight('longFile_WidgetAtBottom_viewportBottom', {
    linesInDoc : 1000, 
    widgetAtLines : [999],
    startingViewportLine : 999
  });

  testWidgetsAffectDocumentHeight('longFile_WidgetAtBottom_endingViewportBottom_multiple', {
    linesInDoc : 1000, 
    widgetAtLines : [998, 999],
    endingViewportLine : 999
  });

})();
