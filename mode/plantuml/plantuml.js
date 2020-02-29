/*
 *      PlantUML Mode for CodeMirror
 *      @author keisuke kimura https://github.com/kkeisuke
 *      @link   https://github.com/kkeisuke/plantuml-editor/blob/master/src/lib/codemirror/mode/plantuml/plantuml.js
 */
(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"), require("../../addon/mode/simple"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror", "../../addon/mode/simple"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
  CodeMirror.defineSimpleMode('plantuml', {
    start: [
      // シングルライン コメント
      // TODO ^ が効かない
      {
        regex: /^'.*/,
        token: 'comment'
      },
      // ダブルコーテーション付の文字列
      {
        regex: /"(?:[^\\]|\\.)*?(?:"|$)/,
        token: 'string'
      },
      // {
      //   regex: /@enduml|@startuml/,
      //   token: 'keyword'
      // },
      {
        regex: /\b(abstract|actor|agent|class|component|database|enum|interface|node|note|object|participant|partition|rectangle|state|static|storage|usecase)\b/,
        token: 'keyword'
      },
      {
        regex: /\b(true|false)\b/,
        token: 'keyword'
      },
      {
        regex: /\b(activate|again|allow_mixing|also|alt|as|autonumber|bottom|box|break|caption|center|create|critical|deactivate|destroy|direction|down|else|end|endfooter|endheader|endif|endlegend|endwhile|entity|footbox|footer|fork|group)\b/,
        token: 'atom'
      },
      {
        regex: /\b(header|hide|if|is|left|legend|link|loop|namespace|newpage|of|on|opt|over|package|page|par|ref|repeat|return|right|rotate|scale|show|skin|skinparam|start|stop|title|then|top|up|while)\b/,
        token: 'atom'
      },
      {
        regex: /!define/,
        token: 'atom'
      },
      {
        regex: /(AliceBlue|AntiqueWhite|Aqua|Aquamarine|Azure|Beige|Bisque|Black|BlanchedAlmond|Blue|BlueViolet|Brown|BurlyWood|CadetBlue|Chartreuse|Chocolate|Coral|CornflowerBlue|Cornsilk|Crimson|Cyan|DarkBlue|DarkCyan|DarkGoldenRod|DarkGray|DarkGreen|DarkGrey|DarkKhaki|DarkMagenta|DarkOliveGreen|DarkOrchid|DarkRed|DarkSalmon|DarkSeaGreen|DarkSlateBlue|DarkSlateGray|DarkSlateGrey|DarkTurquoise|DarkViolet|Darkorange|DeepPink|DeepSkyBlue|DimGray|DimGrey|DodgerBlue|FireBrick|FloralWhite|ForestGreen|Fuchsia|Gainsboro|GhostWhite|Gold|GoldenRod|Gray|Green|GreenYellow|Grey|HoneyDew|HotPink|IndianRed|Indigo|Ivory|Khaki|Lavender|LavenderBlush|LawnGreen|LemonChiffon|LightBlue|LightCoral|LightCyan|LightGoldenRodYellow|LightGray|LightGreen|LightGrey|LightPink|LightSalmon|LightSeaGreen|LightSkyBlue|LightSlateGray|LightSlateGrey|LightSteelBlue|LightYellow|Lime|LimeGreen|Linen|Magenta|Maroon|MediumAquaMarine|MediumBlue|MediumOrchid|MediumPurple|MediumSeaGreen|MediumSlateBlue|MediumSpringGreen|MediumTurquoise|MediumVioletRed|MidnightBlue|MintCream|MistyRose|Moccasin|NavajoWhite|Navy|OldLace|Olive|OliveDrab|Orange|OrangeRed|Orchid|PaleGoldenRod|PaleGreen|PaleTurquoise|PaleVioletRed|PapayaWhip|PeachPuff|Peru|Pink|Plum|PowderBlue|Purple|Red|RosyBrown|RoyalBlue|SaddleBrown|Salmon|SandyBrown|SeaGreen|SeaShell|Sienna|Silver|SkyBlue|SlateBlue|SlateGray|SlateGrey|Snow|SpringGreen|SteelBlue|Tan|Teal|Thistle|Tomato|Turquoise|Violet|Wheat|White|WhiteSmoke|Yellow|YellowGreen)/,
        token: 'variable-3'
      },
      // 単語
      {
        regex: /[a-zA-Z$][\w$]*/,
        token: 'variable'
      },
      // -->
      // TODO 旧アクティビティ図対応のため、\s を先頭に付けていない。
      {
        regex: /-+(up|right|down|left)*-*[|]?[>*o]*\s/,
        token: 'variable-2'
      },
      //  ..>
      {
        regex: /\s\.+(up|right|down|left)*\.*[|]?[>*o]*\s/,
        token: 'variable-2'
      },
      //  <--
      {
        regex: /\s[<*o]*[|]?-+(up|right|down|left)*-*\s/,
        token: 'variable-2'
      },
      // <..
      {
        regex: /\s[<*o]*[|]?\.+(up|right|down|left)*\.*\s/,
        token: 'variable-2'
      },
      // 記号
      {
        regex: /(<<|>>|:|;|\\n)/,
        token: 'variable-2'
      },
      // Public メソッド
      {
        regex: /\+[^(]+\(\)/,
        token: 'variable-2'
      },
      // Private メソッド
      {
        regex: /-[^(]+\(\)/,
        token: 'variable-2'
      },
      // Protected メソッド
      {
        regex: /#[^(]+\(\)/,
        token: 'variable-2'
      },
      // Activity β タイトル
      // TODO ER図と重複してしまう
      // {
      //   regex: /\|[^|#]+\|/,
      //   token: 'variable-2'
      // },
      // {} 内のインデントを揃える
      {
        regex: /[{[(]/,
        indent: true
      },
      {
        regex: /[}\])]/,
        dedent: true
      },
      // 複数行のコメント
      {
        regex: /\/'/,
        token: 'comment',
        next: 'comment'
      }
    ],
    // 複数行のコメント
    comment: [
      {
        regex: /.*?'\//,
        token: 'comment',
        next: 'start'
      },
      {
        regex: /.*/,
        token: 'comment'
      }
    ]
  })
})
