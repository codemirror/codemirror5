/**********************************************************
* This script provides auto completion
* support for the Ntriples format.
* Ntriples format specification: 
*     http://www.w3.org/TR/rdf-testcases/#ntriples
***********************************************************/

  // Minimal event-handling wrapper.
  function stopEvent() {
    if (this.preventDefault) {this.preventDefault(); this.stopPropagation();}
    else {this.returnValue = false; this.cancelBubble = true;}
  }
  function addStop(event) {
    if (!event.stop) event.stop = stopEvent;
    return event;
  }
  function connect(node, type, handler) {
    function wrapHandler(event) {handler(addStop(event || window.event));}
    if (typeof node.addEventListener == "function")
      node.addEventListener(type, wrapHandler, false);
    else
      node.attachEvent("on" + type, wrapHandler);
  }

  function forEach(arr, f) {
    for (var i = 0, e = arr.length; i < e; ++i) f(arr[i]);
  }
 
  function startComplete() {
    // We want a single cursor position.
    if (editor.somethingSelected()) return;
    // Find the token at the cursor
    var cur = editor.getCursor(false), token = editor.getTokenAt(cur), tprop = token;
    var context = [];
    if (token.string == "<" || token.string == "#" || token.string == '_' || token.string == '@' || token.string == '^') {
      var tprop = editor.getTokenAt({line: cur.line, ch: cur.ch});      
      context.push(tprop);
    }
    
    var completions = getCompletions(token, context);
    if (!completions.length) return;
    
    function insert(str) {
      editor.replaceRange(str, {line: cur.line, ch: token.start+1}, {line: cur.line, ch: token.end});
    }
    // When there is only one completion, use it directly.
    if (completions.length == 1) {insert(completions[0]); return true;}

    // Build the select widget
    var complete = document.createElement("div");
    complete.className = "completions";
    var sel = complete.appendChild(document.createElement("select"));
    sel.multiple = true;
    for (var i = 0; i < completions.length; ++i) {
      var opt = sel.appendChild(document.createElement("option"));
      opt.appendChild(document.createTextNode(completions[i]));
    }
    sel.firstChild.selected = true;
    sel.size = Math.min(10, completions.length);
    var pos = editor.cursorCoords();
    complete.style.left = pos.x + "px";
    complete.style.top = pos.yBot + "px";
    document.body.appendChild(complete);
    // Hack to hide the scrollbar.
    if (completions.length <= 10)
      complete.style.width = (sel.clientWidth - 1) + "px";

    var done = false;
    function close() {
      if (done) return;
      done = true;
      complete.parentNode.removeChild(complete);
    }
    function pick() {
      insert(sel.options[sel.selectedIndex].value);
      close();
      setTimeout(function(){editor.focus();}, 50);
    }
    connect(sel, "blur", close);
    connect(sel, "keydown", function(event) {
      var code = event.keyCode;
      // Enter and space
      if (code == 13 || code == 32) {event.stop(); pick();}
      // Escape
      else if (code == 27) {event.stop(); close(); editor.focus();}
      else if (code != 38 && code != 40) {close(); editor.focus(); setTimeout(startComplete, 50);}
    });
    connect(sel, "dblclick", pick);

    sel.focus();
    // Opera sometimes ignores focusing a freshly created node
    if (window.opera) setTimeout(function(){if (!done) sel.focus();}, 100);
    return true;
  }

  var XMLSCHEMA_NS = 'http://xmlschema/2001/ns#';
  var predefinedTypes = ['boolean', 'byte', 'short', 'integer', 'long', 'float', 'double'];

  function getCompletions(token, context) {
    var appendIfNotEmpty = function(a, s, postfix, prefix) { if(s.length > 0) { if(postfix) {s += postfix}; if(prefix) {s = prefix+s}; a.push(s); }};
    var found = [];
    if (context) {
      var obj = context.pop();
      if( !obj ) return found;
      if (obj.className == "uri-anchor") {
        for( var i in obj.state.anchors) {
            appendIfNotEmpty(found, obj.state.anchors[i], '>');
        }
      } else if (obj.className == "uri") {
        for( var i in obj.state.uris) {
            appendIfNotEmpty(found, obj.state.uris[i]);
        }
      } else if (obj.className == "bnode") {
        for( var i in obj.state.bnodes) {
            appendIfNotEmpty(found, obj.state.bnodes[i]);
        }
      } else if (obj.className == "literal-lang") {
          for( var i in obj.state.langs) {
              appendIfNotEmpty(found, obj.state.langs[i]);
          } 
      } else if (obj.className == "literal-type") {
          for( var i in obj.state.types) {
              appendIfNotEmpty(found, obj.state.types[i], '>', '^');
          }
          for( var i in predefinedTypes) {
              found.push('^<' + XMLSCHEMA_NS + predefinedTypes[i] + '>');
          }
      }
   }
    return found;
  }

