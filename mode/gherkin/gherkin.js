/*
Gherkin mode - http://www.cukes.info/
Report bugs/issues here: https://github.com/marijnh/CodeMirror/issues
*/

// Following Objs from Brackets implementation: https://github.com/tregusti/brackets-gherkin/blob/master/main.js
//var Quotes = {
//  SINGLE: 1,
//  DOUBLE: 2
//};

//var regex = {
//  keywords: /(Feature| {2}(Scenario|In order to|As|I)| {4}(Given|When|Then|And))/
//};

CodeMirror.defineMode("gherkin", function () {
  return {
    startState: function () {
      return {
        lineNumber: 0,
        tableHeaderLine: null,
        allowFeature: true,
        allowBackground: false,
        allowScenario: false,
        allowSteps: false,
        allowPlaceholders: false,
        inMultilineArgument: false,
        inMultilineString: false,
        inMultilineTable: false
      };
    },
    token: function (stream, state) {
      if (stream.sol()) {
        state.lineNumber++;
      }
      stream.eatSpace();

      // INSIDE OF MULTILINE ARGUMENTS
      if (state.inMultilineArgument) {

        // STRING
        if (state.inMultilineString) {
          if (stream.match('"""')) {
            state.inMultilineString = false;
            state.inMultilineArgument = false;
          } else {
            stream.match(/.*/);
          }
          return "string";
        }

        // TABLE
        if (state.inMultilineTable) {
          // New table, assume first row is headers
          if (state.tableHeaderLine === null) {
            state.tableHeaderLine = state.lineNumber;
          }

          if (stream.match(/\|\s*/)) {
            if (stream.eol()) {
              state.inMultilineTable = false;
            }
            return "bracket";
          } else {
            stream.match(/[^\|]*/);
            return state.tableHeaderLine === state.lineNumber ? "property" : "string";
          }
        }

        // DETECT START
        if (stream.match('"""')) {
          // String
          state.inMultilineString = true;
          return "string";
        } else if (stream.match("|")) {
          // Table
          state.inMultilineTable = true;
          return "bracket";
        } else {
          // Or abort
          state.inMultilineArgument = false;
          state.tableHeaderLine = null;
        }


        return null;
      }

      // LINE COMMENT
      if (stream.match(/#.*/)) {
        return "comment";

      // TAG
      } else if (stream.match(/@\S+/)) {
        return "def";

      // FEATURE
      } else if (state.allowFeature && stream.match(/Feature:/)) {
        state.allowScenario = true;
        state.allowBackground = true;
        state.allowPlaceholders = false;
        state.allowSteps = false;
        return "keyword";

      // BACKGROUND
      } else if (state.allowBackground && stream.match("Background:")) {
        state.allowPlaceholders = false;
        state.allowSteps = true;
        state.allowBackground = false;
        return "keyword";

      // SCENARIO OUTLINE
      } else if (state.allowScenario && stream.match("Scenario Outline:")) {
        state.allowPlaceholders = true;
        state.allowSteps = true;
        return "keyword";

      // EXAMPLES
      } else if (state.allowScenario && stream.match("Examples:")) {
        state.allowPlaceholders = false;
        state.allowSteps = true;
        state.allowBackground = false;
        state.inMultilineArgument = true;
        return "keyword";

      // SCENARIO
      } else if (state.allowScenario && stream.match(/Scenario:/)) {
        state.allowPlaceholders = false;
        state.allowSteps = true;
        state.allowBackground = false;
        return "keyword";

      // STEPS
      } else if (state.allowSteps && stream.match(/(Given|When|Then|And|But)/)) {
        return "keyword";

      // INLINE STRING
      } else if (!state.inMultilineArgument && stream.match(/"/)) {
        stream.match(/.*?"/);
        return "string";

      // MULTILINE ARGUMENTS
      } else if (state.allowSteps && stream.eat(":")) {
        if (stream.match(/\s*$/)) {
          state.inMultilineArgument = true;
          return "keyword";
        } else {
          return null;
        }

      } else if (state.allowSteps && stream.match("<")) {
        if (stream.match(/.*?>/)) {
          return "property";
        } else {
          return null;
        }

      // Fall through
      } else {
        stream.eatWhile(/[^":<]/);
      }

      return null;
    }
  };
});

CodeMirror.defineMIME("text/x-feature", "gherkin");
