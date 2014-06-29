CodeMirror.defineMode('powershell', function() {
    'use strict';

    function wordRegexp(words) {
        var escaped = [];
        for (var i = 0; i < words.length; i++) {
          escaped[i] = words[i].replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        }

        return new RegExp('^(' + escaped.join('|') + ')\\b', 'i');
    }

    function joinRegexps(patterns) {
        return new RegExp('^(' + patterns.join('|') + ')(?=\\s|$)', 'i');
    }

    var atoms = wordRegexp(['$true', '$false', '$null']);
    var keywords = wordRegexp([
        'begin', 'break', 'catch', 'continue', 'data', 'default', 'do', 'dynamicparam',
        'else', 'elseif', 'end', 'exit', 'filter', 'finally', 'for', 'foreach', 'from', 'function', 'if', 'in',
        'param', 'process', 'return', 'switch', 'throw', 'trap', 'try', 'until', 'where', 'while'
    ]);

    var wordOperators = wordRegexp([
        '-f',
        '-not', '-bnot',
        '-split', '-isplit', '-csplit', '-join',
        '-is', '-isnot', '-as',
        '-eq', '-ieq', '-ceq', '-ne', '-ine', '-cne',
        '-gt', '-igt', '-cgt', '-ge', '-ige', '-cge',
        '-lt', '-ilt', '-clt', '-le', '-ile', '-cle',
        '-like', '-ilike', '-clike', '-notlike', '-inotlike', '-cnotlike',
        '-match', '-imatch', '-cmatch', '-notmatch', '-inotmatch', '-cnotmatch',
        '-contains', '-icontains', '-ccontains', '-notcontains', '-inotcontains', '-cnotcontains',
        '-replace', '-ireplace', '-creplace',
        '-band', '-bor', '-bxor',
        '-and', '-or', '-xor'
    ]);

    var punctuation = /[\[\]\(\){},;`\.]|@[({]/;
    var symbolOperators = /[+\-*\/%]=|\+\+|--|\.\.|[+\-*&^%:=<>!|\/]/;
    var strings = /("|')(\`?.)*?\1/;
    var identifiers = /^[A-Za-z\_][A-Za-z\-\_\d]*\b/;
    var builtins = joinRegexps([
        '[A-Z]:',
        'cd|help|mkdir|more|oss|prompt',
        '%|\\?|ac|asnp|cat|cd|chdir|clc|clear|clhy|cli|clp|cls|clv|cnsn|compare|copy|cp|cpi|cpp|cvpa|dbp|del|diff|dir|dnsn|ebp'
          + '|echo|epal|epcsv|epsn|erase|etsn|exsn|fc|fl|foreach|ft|fw|gal|gbp|gc|gci|gcm|gcs|gdr|ghy|gi|gjb|gl|gm|gmo|gp|gps'
          + '|group|gsn|gsnp|gsv|gu|gv|gwmi|h|history|icm|iex|ihy|ii|ipal|ipcsv|ipmo|ipsn|irm|ise|iwmi|iwr|kill|lp|ls|man|md'
          + '|measure|mi|mount|move|mp|mv|nal|ndr|ni|nmo|npssc|nsn|nv|ogv|oh|popd|ps|pushd|pwd|r|rbp|rcjb|rcsn|rd|rdr|ren|ri'
          + '|rjb|rm|rmdir|rmo|rni|rnp|rp|rsn|rsnp|rujb|rv|rvpa|rwmi|sajb|sal|saps|sasv|sbp|sc|select|set|shcm|si|sl|sleep|sls'
          + '|sort|sp|spjb|spps|spsv|start|sujb|sv|swmi|tee|trcm|type|where|wjb|write',
        'Add-(Computer|Content|History|Member|PSSnapin|Type)',
        'Checkpoint-Computer',
        'Clear-(Content|EventLog|History|Host|Item|ItemProperty|Variable)',
        'Compare-Object',
        'Complete-Transaction',
        'Connect-PSSession',
        'ConvertFrom-(Csv|Json|SecureString|StringData)',
        'Convert-Path',
        'ConvertTo-(Csv|Html|Json|SecureString|Xml)',
        'Copy-Item(Property)?',
        'Debug-Process',
        'Disable-(ComputerRestore|PSBreakpoint|PSRemoting|PSSessionConfiguration)',
        'Disconnect-PSSession',
        'Enable-(ComputerRestore|PSBreakpoint|PSRemoting|PSSessionConfiguration)',
        '(Enter|Exit)-PSSession',
        'Export-(Alias|Clixml|Console|Counter|Csv|FormatData|ModuleMember|PSSession)',
        'ForEach-Object',
        'Format-(Custom|List|Table|Wide)',
        'Get-(Acl|Alias|AuthenticodeSignature|ChildItem|Command|ComputerRestorePoint|Content|ControlPanelItem|Counter|Credential'
          + '|Culture|Date|Event|EventLog|EventSubscriber|ExecutionPolicy|FormatData|Help|History|Host|HotFix|Item|ItemProperty|Job'
          + '|Location|Member|Module|PfxCertificate|Process|PSBreakpoint|PSCallStack|PSDrive|PSProvider|PSSession|PSSessionConfiguration'
          + '|PSSnapin|Random|Service|TraceSource|Transaction|TypeData|UICulture|Unique|Variable|Verb|WinEvent|WmiObject)',
        'Group-Object',
        'Import-(Alias|Clixml|Counter|Csv|LocalizedData|Module|PSSession)',
        'ImportSystemModules',
        'Invoke-(Command|Expression|History|Item|RestMethod|WebRequest|WmiMethod)',
        'Join-Path',
        'Limit-EventLog',
        'Measure-(Command|Object)',
        'Move-Item(Property)?',
        'New-(Alias|Event|EventLog|Item(Property)?|Module|ModuleManifest|Object|PSDrive|PSSession|PSSessionConfigurationFile'
          + '|PSSessionOption|PSTransportOption|Service|TimeSpan|Variable|WebServiceProxy|WinEvent)',
        'Out-(Default|File|GridView|Host|Null|Printer|String)',
        'Pause',
        '(Pop|Push)-Location',
        'Read-Host',
        'Receive-(Job|PSSession)',
        'Register-(EngineEvent|ObjectEvent|PSSessionConfiguration|WmiEvent)',
        'Remove-(Computer|Event|EventLog|Item(Property)?|Job|Module|PSBreakpoint|PSDrive|PSSession|PSSnapin|TypeData|Variable|WmiObject)',
        'Rename-(Computer|Item(Property)?)',
        'Reset-ComputerMachinePassword',
        'Resolve-Path',
        'Restart-(Computer|Service)',
        'Restore-Computer',
        'Resume-(Job|Service)',
        'Save-Help',
        'Select-(Object|String|Xml)',
        'Send-MailMessage',
        'Set-(Acl|Alias|AuthenticodeSignature|Content|Date|ExecutionPolicy|Item(Property)?|Location|PSBreakpoint|PSDebug'
          + '|PSSessionConfiguration|Service|StrictMode|TraceSource|Variable|WmiInstance)',
        'Show-(Command|ControlPanelItem|EventLog)',
        'Sort-Object',
        'Split-Path',
        'Start-(Job|Process|Service|Sleep|Transaction|Transcript)',
        'Stop-(Computer|Job|Process|Service|Transcript)',
        'Suspend-(Job|Service)',
        'TabExpansion2',
        'Tee-Object',
        'Test-(ComputerSecureChannel|Connection|ModuleManifest|Path|PSSessionConfigurationFile)',
        'Trace-Command',
        'Unblock-File',
        'Undo-Transaction',
        'Unregister-(Event|PSSessionConfiguration)',
        'Update-(FormatData|Help|List|TypeData)',
        'Use-Transaction',
        'Wait-(Event|Job|Process)',
        'Where-Object',
        'Write-(Debug|Error|EventLog|Host|Output|Progress|Verbose|Warning)'
    ]);

    // tokenizers
    function tokenBase(stream, state) {
        // Handle Comments
        //var ch = stream.peek();

        if (stream.eatSpace()) {
            return null;
        }

        if (stream.match(keywords)) {
            return 'keyword';
        }

        if (stream.match(strings)) {
            return 'string';
        }

        if (stream.match(wordOperators) || stream.match(symbolOperators)) {
            return 'operator';
        }

        if (stream.match(builtins)) {
            return 'builtin';
        }

        if (stream.match(punctuation)) {
            return 'punctuation';
        }

        if (stream.match(identifiers)) {
            return 'identifier';
        }

        if (stream.match(atoms)) {
            return 'atom';
        }

        // Handle Number Literals
        if (stream.match(/^[0-9\.]/, false)) {
            var floatLiteral = false;
            // Floats
            if (stream.match(/^\d*\.\d+(e[\+\-]?\d+)?/i)) { floatLiteral = true; }
            if (stream.match(/^\d+\.\d*/)) { floatLiteral = true; }
            if (stream.match(/^\.\d+/)) { floatLiteral = true; }
            if (floatLiteral) {
                // Float literals may be "imaginary"
                stream.eat(/J/i);
                return 'number';
            }
            // Integers
            var intLiteral = false;
            // Hex
            if (stream.match(/^0x[0-9a-f]+/i)) { intLiteral = true; }
            // Decimal
            if (stream.match(/^[1-9]\d*(e[\+\-]?\d+)?/)) {
                // Decimal literals may be "imaginary"
                stream.eat(/J/i);
                // TODO - Can you have imaginary longs?
                intLiteral = true;
            }
            // Zero by itself with no other piece of number.
            if (stream.match(/^0(?![\dx])/i)) { intLiteral = true; }
            if (intLiteral) {
                // Integer literals may be "long"
                stream.eat(/L/i);
                return 'number';
            }
        }

        var ch = stream.next();
        if (ch === '$') {
            if (stream.eat('{')) {
                state.tokenize = tokenVariable;
                return tokenVariable(stream, state);
            } else {
                stream.eatWhile(/[\w\\\-:]/);
                return 'variable-2';
            }
        }

        if (ch === '<' && stream.eat('#')) {
            state.tokenize = tokenComment;
            return tokenComment(stream, state);
        }

        if (ch === '#') {
            stream.skipToEnd();
            return 'comment';
        }

        if (ch === '@') {
            var quoteMatch = stream.eat(/["']/);
            if (quoteMatch && stream.eol()) {
                state.tokenize = tokenMultiString;
                state.startQuote = quoteMatch[0];
                return tokenMultiString(stream, state);
            }
        }

        stream.next();
        return 'error';
    }

    function tokenComment(stream, state) {
      var maybeEnd = false, ch;
      while ((ch = stream.next()) != null) {
          if (maybeEnd && ch == '>') {
              state.tokenize = tokenBase;
              break;
          }
          maybeEnd = (ch === '#');
      }
      return('comment');
    }

	function tokenVariable(stream, state) {
      var ch;
      while ((ch = stream.next()) != null) {
      if (ch === '}') {
        state.tokenize = tokenBase;
        break;
      }
    }
    return('variable-2');
	}

    function tokenMultiString(stream, state) {
        var quote = state.startQuote;
        if (stream.sol() && stream.match(new RegExp(quote + '@'))) {
            state.tokenize = tokenBase;
        }
        else {
            stream.skipToEnd();
        }

        return 'string';
    }

    function tokenLexer(stream, state) {
        //indentInfo = null;
        var style = state.tokenize(stream, state);
        //var current = stream.current();
        return style;
    }

    var external = {
        startState: function(basecolumn) {
            return {
              tokenize: tokenBase,
              scopes: [{offset:basecolumn || 0, type:'py'}],
              lastToken: null,
              lambda: false,
              dedent: 0
          };
        },

        token: function(stream, state) {
            var style = tokenLexer(stream, state);
            state.lastToken = {style:style, content: stream.current()};
            if (stream.eol() && stream.lambda) {
                state.lambda = false;
            }

            return style;
        },

        blockCommentStart: '<#',
        blockCommentEnd: '#>',
        lineComment: '#'
    };
    return external;
});

CodeMirror.defineMIME('text/x-powershell', 'powershell');
