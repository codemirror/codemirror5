//   Copyright (C) 2012 by Douglas Tarr <douglas.tarr@gmail.com>
// released under the MIT license (../../LICENSE) like the rest of CodeMirror

CodeMirror.isBlank = function(str)
{
    return (!str || /^\s*$/.test(str));
}

CodeMirror.indentRangeFinder = function(cm, line) {
  var handle = cm.getLineHandle(line);

  // count how many spaces start the line

  // look at each line until we find a line with that number of spaces
  // if the second line has same or less spaces return immediately
  var spaceCount = handle.indentation(cm.getOption('tabSize'));

  var count = 1, lastLine = cm.lineCount(), end;
  var indentTo = null;
  for (var i = lastLine - 1; i > line ; --i) {
    var curLineHandle = cm.getLineHandle(i);
    var lineSpaceCount = curLineHandle.indentation(cm.getOption('tabSize'));

    if (CodeMirror.isBlank(curLineHandle.text))
    {
        continue;
    }

    if (lineSpaceCount <= spaceCount )
    {
        indentTo = null;
    }
    else
    {
        if (indentTo == null)
        {
            indentTo = i;
        }
    }
  }

  if (indentTo == null)
  {
      return;
  }
  return indentTo + 1;
};
