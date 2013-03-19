(function () {
  function htmlHint(editor, htmlStructure, getToken) {
    var cur = editor.getCursor();
    var token = getToken(editor, cur);
    var keywords = [];
    var i = 0;
    var j = 0;
    var k = 0;
    var from = {line: cur.line, ch: cur.ch};
    var to = {line: cur.line, ch: cur.ch};
    var flagClean = true;

    var text = editor.getRange({line: 0, ch: 0}, cur);

    var open = text.lastIndexOf('<');
    var close = text.lastIndexOf('>');
    var tokenString = token.string.replace("<","");

    if(open > close) {
      var last = editor.getRange({line: cur.line, ch: cur.ch - 1}, cur);
      if(last == "<") {
        for(i = 0; i < htmlStructure.length; i++) {
          keywords.push(htmlStructure[i].tag);
        }
        from.ch = token.start + 1;
      } else {
        var counter = 0;
        var found = function(token, type, position) {
          counter++;
          if(counter > 50) return;
          if(token.type == type) {
            return token;
          } else {
            position.ch = token.start;
            var newToken = editor.getTokenAt(position);
            return found(newToken, type, position);
          }
        };

        var nodeToken = found(token, "tag", {line: cur.line, ch: cur.ch});
        var node = nodeToken.string.substring(1);

        if(token.type === null && token.string.trim() === "") {
          for(i = 0; i < htmlStructure.length; i++) {
            if(htmlStructure[i].tag == node) {
              for(j = 0; j < htmlStructure[i].attr.length; j++) {
                keywords.push(htmlStructure[i].attr[j].key + "=\"\" ");
              }

              for(k = 0; k < globalAttributes.length; k++) {
                keywords.push(globalAttributes[k].key + "=\"\" ");
              }
            }
          }
        } else if(token.type == "string") {
          tokenString = tokenString.substring(1, tokenString.length - 1);
          var attributeToken = found(token, "attribute", {line: cur.line, ch: cur.ch});
          var attribute = attributeToken.string;

          for(i = 0; i < htmlStructure.length; i++) {
            if(htmlStructure[i].tag == node) {
              for(j = 0; j < htmlStructure[i].attr.length; j++) {
                if(htmlStructure[i].attr[j].key == attribute) {
                  for(k = 0; k < htmlStructure[i].attr[j].values.length; k++) {
                    keywords.push(htmlStructure[i].attr[j].values[k]);
                  }
                }
              }

              for(j = 0; j < globalAttributes.length; j++) {
                if(globalAttributes[j].key == attribute) {
                  for(k = 0; k < globalAttributes[j].values.length; k++) {
                    keywords.push(globalAttributes[j].values[k]);
                  }
                }
              }
            }
          }
          from.ch = token.start + 1;
        } else if(token.type == "attribute") {
          for(i = 0; i < htmlStructure.length; i++) {
            if(htmlStructure[i].tag == node) {
              for(j = 0; j < htmlStructure[i].attr.length; j++) {
                keywords.push(htmlStructure[i].attr[j].key + "=\"\" ");
              }

              for(k = 0; k < globalAttributes.length; k++) {
                keywords.push(globalAttributes[k].key + "=\"\" ");
              }
            }
          }
          from.ch = token.start;
        } else if(token.type == "tag") {
          for(i = 0; i < htmlStructure.length; i++) {
            keywords.push(htmlStructure[i].tag);
          }

          from.ch = token.start + 1;
        }
      }
    } else {
      for(i = 0; i < htmlStructure.length; i++) {
        keywords.push("<" + htmlStructure[i].tag);
      }

      tokenString = ("<" + tokenString).trim();
      from.ch = token.start;
    }

    if(flagClean === true && tokenString.trim() === "") {
      flagClean = false;
    }

    if(flagClean) {
      keywords = cleanResults(tokenString, keywords);
    }

    return {list: keywords, from: from, to: to};
  }


  var cleanResults = function(text, keywords) {
    var results = [];
    var i = 0;

    for(i = 0; i < keywords.length; i++) {
      if(keywords[i].substring(0, text.length) == text) {
        results.push(keywords[i]);
      }
    }

    return results;
  };

  var htmlStructure = [
    {tag: '!DOCTYPE', attr: []},
    {tag: 'a', attr: [
      {key: 'href', values: ["#"]},
      {key: 'target', values: ["_blank","_self","_top","_parent"]},
      {key: 'ping', values: [""]},
      {key: 'media', values: ["#"]},
      {key: 'hreflang', values: ["en","es"]},
      {key: 'type', values: []}
    ]},
    {tag: 'abbr', attr: []},
    {tag: 'acronym', attr: []},
    {tag: 'address', attr: []},
    {tag: 'applet', attr: []},
    {tag: 'area', attr: [
      {key: 'alt', values: [""]},
      {key: 'coords', values: ["rect: left, top, right, bottom","circle: center-x, center-y, radius","poly: x1, y1, x2, y2, ..."]},
      {key: 'shape', values: ["default","rect","circle","poly"]},
      {key: 'href', values: ["#"]},
      {key: 'target', values: ["#"]},
      {key: 'ping', values: []},
      {key: 'media', values: []},
      {key: 'hreflang', values: []},
      {key: 'type', values: []}

    ]},
    {tag: 'article', attr: []},
    {tag: 'aside', attr: []},
    {tag: 'audio', attr: [
      {key: 'src', values: []},
      {key: 'crossorigin', values: ["anonymous","use-credentials"]},
      {key: 'preload', values: ["none","metadata","auto"]},
      {key: 'autoplay', values: ["","autoplay"]},
      {key: 'mediagroup', values: []},
      {key: 'loop', values: ["","loop"]},
      {key: 'controls', values: ["","controls"]}
    ]},
    {tag: 'b', attr: []},
    {tag: 'base', attr: [
      {key: 'href', values: ["#"]},
      {key: 'target', values: ["_blank","_self","_top","_parent"]}
    ]},
    {tag: 'basefont', attr: []},
    {tag: 'bdi', attr: []},
    {tag: 'bdo', attr: []},
    {tag: 'big', attr: []},
    {tag: 'blockquote', attr: [
      {key: 'cite', values: ["http://"]}
    ]},
    {tag: 'body', attr: []},
    {tag: 'br', attr: []},
    {tag: 'button', attr: [
      {key: 'autofocus', values: ["","autofocus"]},
      {key: 'disabled', values: ["","disabled"]},
      {key: 'form', values: []},
      {key: 'formaction', values: []},
      {key: 'formenctype', values: ["application/x-www-form-urlencoded","multipart/form-data","text/plain"]},
      {key: 'formmethod', values: ["get","post","put","delete"]},
      {key: 'formnovalidate', values: ["","novalidate"]},
      {key: 'formtarget', values: ["_blank","_self","_top","_parent"]},
      {key: 'name', values: []},
      {key: 'type', values: ["submit","reset","button"]},
      {key: 'value', values: []}
    ]},
    {tag: 'canvas', attr: [
      {key: 'width', values: []},
      {key: 'height', values: []}
    ]},
    {tag: 'caption', attr: []},
    {tag: 'center', attr: []},
    {tag: 'cite', attr: []},
    {tag: 'code', attr: []},
    {tag: 'col', attr: [
      {key: 'span', values: []}
    ]},
    {tag: 'colgroup', attr: [
      {key: 'span', values: []}
    ]},
    {tag: 'command', attr: [
      {key: 'type', values: ["command","checkbox","radio"]},
      {key: 'label', values: []},
      {key: 'icon', values: []},
      {key: 'disabled', values: ["","disabled"]},
      {key: 'checked', values: ["","checked"]},
      {key: 'radiogroup', values: []},
      {key: 'command', values: []},
      {key: 'title', values: []}
    ]},
    {tag: 'data', attr: [
      {key: 'value', values: []}
    ]},
    {tag: 'datagrid', attr: [
      {key: 'disabled', values: ["","disabled"]},
      {key: 'multiple', values: ["","multiple"]}
    ]},
    {tag: 'datalist', attr: [
      {key: 'data', values: []}
    ]},
    {tag: 'dd', attr: []},
    {tag: 'del', attr: [
      {key: 'cite', values: []},
      {key: 'datetime', values: []}
    ]},
    {tag: 'details', attr: [
      {key: 'open', values: ["","open"]}
    ]},
    {tag: 'dfn', attr: []},
    {tag: 'dir', attr: []},
    {tag: 'div', attr: [
      {key: 'id', values: []},
      {key: 'class', values: []},
      {key: 'style', values: []}
    ]},
    {tag: 'dl', attr: []},
    {tag: 'dt', attr: []},
    {tag: 'em', attr: []},
    {tag: 'embed', attr: [
      {key: 'src', values: []},
      {key: 'type', values: []},
      {key: 'width', values: []},
      {key: 'height', values: []}
    ]},
    {tag: 'eventsource', attr: [
      {key: 'src', values: []}
    ]},
    {tag: 'fieldset', attr: [
      {key: 'disabled', values: ["","disabled"]},
      {key: 'form', values: []},
      {key: 'name', values: []}
    ]},
    {tag: 'figcaption', attr: []},
    {tag: 'figure', attr: []},
    {tag: 'font', attr: []},
    {tag: 'footer', attr: []},
    {tag: 'form', attr: [
      {key: 'accept-charset', values: ["UNKNOWN","utf-8"]},
      {key: 'action', values: []},
      {key: 'autocomplete', values: ["on","off"]},
      {key: 'enctype', values: ["application/x-www-form-urlencoded","multipart/form-data","text/plain"]},
      {key: 'method', values: ["get","post","put","delete","dialog"]},
      {key: 'name', values: []},
      {key: 'novalidate', values: ["","novalidate"]},
      {key: 'target', values: ["_blank","_self","_top","_parent"]}
    ]},
    {tag: 'frame', attr: []},
    {tag: 'frameset', attr: []},
    {tag: 'h1', attr: []},
    {tag: 'h2', attr: []},
    {tag: 'h3', attr: []},
    {tag: 'h4', attr: []},
    {tag: 'h5', attr: []},
    {tag: 'h6', attr: []},
    {tag: 'head', attr: []},
    {tag: 'header', attr: []},
    {tag: 'hgroup', attr: []},
    {tag: 'hr', attr: []},
    {tag: 'html', attr: [
      {key: 'manifest', values: []}
    ]},
    {tag: 'i', attr: []},
    {tag: 'iframe', attr: [
      {key: 'src', values: []},
      {key: 'srcdoc', values: []},
      {key: 'name', values: []},
      {key: 'sandbox', values: ["allow-top-navigation","allow-same-origin","allow-forms","allow-scripts"]},
      {key: 'seamless', values: ["","seamless"]},
      {key: 'width', values: []},
      {key: 'height', values: []}
    ]},
    {tag: 'img', attr: [
      {key: 'alt', values: []},
      {key: 'src', values: []},
      {key: 'crossorigin', values: ["anonymous","use-credentials"]},
      {key: 'ismap', values: []},
      {key: 'usemap', values: []},
      {key: 'width', values: []},
      {key: 'height', values: []}
    ]},
    {tag: 'input', attr: [
      {key: 'accept', values: ["audio/*","video/*","image/*"]},
      {key: 'alt', values: []},
      {key: 'autocomplete', values: ["on","off"]},
      {key: 'autofocus', values: ["","autofocus"]},
      {key: 'checked', values: ["","checked"]},
      {key: 'disabled', values: ["","disabled"]},
      {key: 'dirname', values: []},
      {key: 'form', values: []},
      {key: 'formaction', values: []},
      {key: 'formenctype', values: ["application/x-www-form-urlencoded","multipart/form-data","text/plain"]},
      {key: 'formmethod', values: ["get","post","put","delete"]},
      {key: 'formnovalidate', values: ["","novalidate"]},
      {key: 'formtarget', values: ["_blank","_self","_top","_parent"]},
      {key: 'height', values: []},
      {key: 'list', values: []},
      {key: 'max', values: []},
      {key: 'maxlength', values: []},
      {key: 'min', values: []},
      {key: 'multiple', values: ["","multiple"]},
      {key: 'name', values: []},
      {key: 'pattern', values: []},
      {key: 'placeholder', values: []},
      {key: 'readonly', values: ["","readonly"]},
      {key: 'required', values: ["","required"]},
      {key: 'size', values: []},
      {key: 'src', values: []},
      {key: 'step', values: []},
      {key: 'type', values: [
        "hidden","text","search","tel","url","email","password","datetime","date","month","week","time","datetime-local",
        "number","range","color","checkbox","radio","file","submit","image","reset","button"
      ]},
      {key: 'value', values: []},
      {key: 'width', values: []}
    ]},
    {tag: 'ins', attr: [
      {key: 'cite', values: []},
      {key: 'datetime', values: []}
    ]},
    {tag: 'kbd', attr: []},
    {tag: 'keygen', attr: [
      {key: 'autofocus', values: ["","autofocus"]},
      {key: 'challenge', values: []},
      {key: 'disabled', values: ["","disabled"]},
      {key: 'form', values: []},
      {key: 'keytype', values: ["RSA"]},
      {key: 'name', values: []}
    ]},
    {tag: 'label', attr: [
      {key: 'for', values: []},
      {key: 'form', values: []}
    ]},
    {tag: 'legend', attr: []},
    {tag: 'li', attr: [
      {key: 'value', values: []}
    ]},
    {tag: 'link', attr: [
      {key: 'href', values: []},
      {key: 'hreflang', values: ["en","es"]},
      {key: 'media', values: [
        "all","screen","print","embossed","braille","handheld","print","projection","screen","tty","tv","speech","3d-glasses",
        "resolution [>][<][=] [X]dpi","resolution [>][<][=] [X]dpcm","device-aspect-ratio: 16/9","device-aspect-ratio: 4/3",
        "device-aspect-ratio: 32/18","device-aspect-ratio: 1280/720","device-aspect-ratio: 2560/1440","orientation:portrait",
        "orientation:landscape","device-height: [X]px","device-width: [X]px","-webkit-min-device-pixel-ratio: 2"
      ]},
      {key: 'type', values: []},
      {key: 'sizes', values: ["all","16x16","16x16 32x32","16x16 32x32 64x64"]}
    ]},
    {tag: 'map', attr: [
      {key: 'name', values: []}
    ]},
    {tag: 'mark', attr: []},
    {tag: 'menu', attr: [
      {key: 'type', values: ["list","context","toolbar"]},
      {key: 'label', values: []}
    ]},
    {tag: 'meta', attr: [
      {key: 'charset', attr: ["utf-8"]},
      {key: 'name', attr: ["viewport","application-name","author","description","generator","keywords"]},
      {key: 'content', attr: ["","width=device-width","initial-scale=1, maximum-scale=1, minimun-scale=1, user-scale=no"]},
      {key: 'http-equiv', attr: ["content-language","content-type","default-style","refresh"]}
    ]},
    {tag: 'meter', attr: [
      {key: 'value', values: []},
      {key: 'min', values: []},
      {key: 'low', values: []},
      {key: 'high', values: []},
      {key: 'max', values: []},
      {key: 'optimum', values: []}
    ]},
    {tag: 'nav', attr: []},
    {tag: 'noframes', attr: []},
    {tag: 'noscript', attr: []},
    {tag: 'object', attr: [
      {key: 'data', values: []},
      {key: 'type', values: []},
      {key: 'typemustmatch', values: ["","typemustmatch"]},
      {key: 'name', values: []},
      {key: 'usemap', values: []},
      {key: 'form', values: []},
      {key: 'width', values: []},
      {key: 'height', values: []}
    ]},
    {tag: 'ol', attr: [
      {key: 'reversed', values: ["", "reversed"]},
      {key: 'start', values: []},
      {key: 'type', values: ["1","a","A","i","I"]}
    ]},
    {tag: 'optgroup', attr: [
      {key: 'disabled', values: ["","disabled"]},
      {key: 'label', values: []}
    ]},
    {tag: 'option', attr: [
      {key: 'disabled', values: ["", "disabled"]},
      {key: 'label', values: []},
      {key: 'selected', values: ["", "selected"]},
      {key: 'value', values: []}
    ]},
    {tag: 'output', attr: [
      {key: 'for', values: []},
      {key: 'form', values: []},
      {key: 'name', values: []}
    ]},
    {tag: 'p', attr: []},
    {tag: 'param', attr: [
      {key: 'name', values: []},
      {key: 'value', values: []}
    ]},
    {tag: 'pre', attr: []},
    {tag: 'progress', attr: [
      {key: 'value', values: []},
      {key: 'max', values: []}
    ]},
    {tag: 'q', attr: [
      {key: 'cite', values: []}
    ]},
    {tag: 'rp', attr: []},
    {tag: 'rt', attr: []},
    {tag: 'ruby', attr: []},
    {tag: 's', attr: []},
    {tag: 'samp', attr: []},
    {tag: 'script', attr: [
      {key: 'type', values: ["text/javascript"]},
      {key: 'src', values: []},
      {key: 'async', values: ["","async"]},
      {key: 'defer', values: ["","defer"]},
      {key: 'charset', values: ["utf-8"]}
    ]},
    {tag: 'section', attr: []},
    {tag: 'select', attr: [
      {key: 'autofocus', values: ["", "autofocus"]},
      {key: 'disabled', values: ["", "disabled"]},
      {key: 'form', values: []},
      {key: 'multiple', values: ["", "multiple"]},
      {key: 'name', values: []},
      {key: 'size', values: []}
    ]},
    {tag: 'small', attr: []},
    {tag: 'source', attr: [
      {key: 'src', values: []},
      {key: 'type', values: []},
      {key: 'media', values: []}
    ]},
    {tag: 'span', attr: []},
    {tag: 'strike', attr: []},
    {tag: 'strong', attr: []},
    {tag: 'style', attr: [
      {key: 'type', values: ["text/css"]},
      {key: 'media', values: ["all","braille","print","projection","screen","speech"]},
      {key: 'scoped', values: []}
    ]},
    {tag: 'sub', attr: []},
    {tag: 'summary', attr: []},
    {tag: 'sup', attr: []},
    {tag: 'table', attr: [
      {key: 'border', values: []}
    ]},
    {tag: 'tbody', attr: []},
    {tag: 'td', attr: [
      {key: 'colspan', values: []},
      {key: 'rowspan', values: []},
      {key: 'headers', values: []}
    ]},
    {tag: 'textarea', attr: [
      {key: 'autofocus', values: ["","autofocus"]},
      {key: 'disabled', values: ["","disabled"]},
      {key: 'dirname', values: []},
      {key: 'form', values: []},
      {key: 'maxlength', values: []},
      {key: 'name', values: []},
      {key: 'placeholder', values: []},
      {key: 'readonly', values: ["","readonly"]},
      {key: 'required', values: ["","required"]},
      {key: 'rows', values: []},
      {key: 'cols', values: []},
      {key: 'wrap', values: ["soft","hard"]}
    ]},
    {tag: 'tfoot', attr: []},
    {tag: 'th', attr: [
      {key: 'colspan', values: []},
      {key: 'rowspan', values: []},
      {key: 'headers', values: []},
      {key: 'scope', values: ["row","col","rowgroup","colgroup"]}
    ]},
    {tag: 'thead', attr: []},
    {tag: 'time', attr: [
      {key: 'datetime', values: []}
    ]},
    {tag: 'title', attr: []},
    {tag: 'tr', attr: []},
    {tag: 'track', attr: [
      {key: 'kind', values: ["subtitles","captions","descriptions","chapters","metadata"]},
      {key: 'src', values: []},
      {key: 'srclang', values: ["en","es"]},
      {key: 'label', values: []},
      {key: 'default', values: []}
    ]},
    {tag: 'tt', attr: []},
    {tag: 'u', attr: []},
    {tag: 'ul', attr: []},
    {tag: 'var', attr: []},
    {tag: 'video', attr: [
      {key: "src", values: []},
      {key: "crossorigin", values: ["anonymous","use-credentials"]},
      {key: "poster", values: []},
      {key: "preload", values: ["auto","metadata","none"]},
      {key: "autoplay", values: ["","autoplay"]},
      {key: "mediagroup", values: ["movie"]},
      {key: "loop", values: ["","loop"]},
      {key: "muted", values: ["","muted"]},
      {key: "controls", values: ["","controls"]},
      {key: "width", values: []},
      {key: "height", values: []}
    ]},
    {tag: 'wbr', attr: []}
  ];

  var globalAttributes = [
    {key: "accesskey", values: ["a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","y","z","0","1","2","3","4","5","6","7","8","9"]},
    {key: "class", values: []},
    {key: "contenteditable", values: ["true", "false"]},
    {key: "contextmenu", values: []},
    {key: "dir", values: ["ltr","rtl","auto"]},
    {key: "draggable", values: ["true","false","auto"]},
    {key: "dropzone", values: ["copy","move","link","string:","file:"]},
    {key: "hidden", values: ["hidden"]},
    {key: "id", values: []},
    {key: "inert", values: ["inert"]},
    {key: "itemid", values: []},
    {key: "itemprop", values: []},
    {key: "itemref", values: []},
    {key: "itemscope", values: ["itemscope"]},
    {key: "itemtype", values: []},
    {key: "lang", values: ["en","es"]},
    {key: "spellcheck", values: ["true","false"]},
    {key: "style", values: []},
    {key: "tabindex", values: ["1","2","3","4","5","6","7","8","9"]},
    {key: "title", values: []},
    {key: "translate", values: ["yes","no"]},
    {key: "onclick", values: []},
    {key: 'rel', values: ["stylesheet","alternate","author","bookmark","help","license","next","nofollow","noreferrer","prefetch","prev","search","tag"]}
  ];

  CodeMirror.htmlHint = function(editor) {
    if(String.prototype.trim == undefined) {
      String.prototype.trim=function(){return this.replace(/^\s+|\s+$/g, '');};
    }
    return htmlHint(editor, htmlStructure, function (e, cur) { return e.getTokenAt(cur); });
  };
})();
