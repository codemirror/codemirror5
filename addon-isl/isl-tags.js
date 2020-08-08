/** MIT License

Copyright (C) 2018 by Kinjal Hinsu.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

/**
 * List of frequently used tags,
 * their attribute and values
 * specifically used in ISL
 */

(function(mod) { 
    if(!CodeMirror.isl){
        CodeMirror.isl={};
    }
    mod(CodeMirror);
})(function(CodeMirror) {
  "use strict";

    /**
     * list of tags for autoComplete add-on
     * @property tags
     */
    CodeMirror.isl.tags = {
        text: {
            attrs: {
                ref: null
            }
        },
        var: {
            attrs: {
                name: ["formed_GS","figed_GS","item_instance_values"],
                value: ["()","\"\"","{\"\",\"\"}","\"<math></math>\"",
                        "@.toolLayout.createTool(\"formed\",\"formed_GS\",\"editor\",#{\n\trecall:text(text1_GS),\nextraButtons:{div,pow},\n" +
                        "features:#{ansed:#{input:#{keyboard:{\"letters\",\"par1\"}}}},\n" +
                        "feedbacks:#{checkVariablesNoEqual:\"@var1;@var2;\",\nrepeatVariable:\"true\",\ncheckExponentValue:\"neg|msg_neg_exponent\"}})",
                        "@.toolLayout.createTool(\"figed\",\"figed_GS\",\"display\",#{\nwidth:000,\nheight:000,\n" +
                        "recall:text(figure_source_GS),\nmenu:zone,\nmenuXY:frac_alge})",
                        "@.toolLayout.createTool(\"tabed\",\"tabed_GS\",\"editor\",#{recall:text(tabed_source)})>"]
            }
        },
        varadd: {
            attrs: {
                name: null,
                value: null,
            }
        },
        if: {
            attrs: {
                cond: ["()",
                "(@num1;!=@num2;)","(@num1;==@num2;)","(@num1;>@num2;)","(@num1;<@num2;)","(@num1;>=@num2;)","(@num1;<=@num2;)",
                "(exist(.isAccessible))",
                "(\"@modeRequested;\" == \"static\")",
                "(\"@itemAnspro.isCorrectFeedback(\"GS\")\" == \"true\")"],
            }
        },
        else: {
            attrs: {
                cond: ["()",
                "(@num1;!=@num2;)","(@num1;==@num2;)","(@num1;>@num2;)","(@num1;<@num2;)","(@num1;>=@num2;)","(@num1;<=@num2;)",
                "(exist(.isAccessible))",
                "(\"@modeRequested;\" == \"static\")",
                "(\"@itemAnspro.isCorrectFeedback(\"GS\")\" == \"true\")"],
            }
        },
        table: {
            attrs: {
                role: ["\"presentation\""]
            },
        children: ["tr"]
        },
        tr: {
            attrs: {
                align: ["left","center","right"],
                width: null,
                height: null
            },
            children: ["td"]
        },
        td: {
            attrs: {
                align: ["left","center","right"],
                width: null,
                height: null
            }
        },
        math:{},
        sub:{},
        sup:{},
        p:{},
        sysout:{
            attrs: {
                value: ["\"\""]
            }
        },
        INSTANCE: {},
        integer: {
            attrs: {
                name: null,
                from: null,
                to: null
            }
        },
        rvalue: {
            attrs: {
                name: null,
                list: null,
            }
        },
        pvalue: {
            attrs: {
                name: ["{\"\"}"],
                list: ["{\"\"}"],
            }
        },
        object: {
            attrs: {
                name: ["ansed"],
                returnValue: ["ans_returned_GS"],
            }
        }, 
        for: {
            attrs: {
                name: null,
                value: null,
                cond: ["()","(@num1;!=@num2;)","(@num1;==@num2;)","(@num1;>@num2;)","(@num1;<@num2;)","(@num1;>=@num2;)","(@num1;<=@num2;)"],
                next: null
            }
        },
        while: {
            attrs: {
                cond: ["()","(@num1;!=@num2;)","(@num1;==@num2;)","(@num1;>@num2;)","(@num1;<@num2;)","(@num1;>=@num2;)","(@num1;<=@num2;)"]
            }
        },
        img: {
            attrs: {
                name: ["\"https://gibbs.aleks.com\"\/"]
            }
        },
        function: {
            attrs: {
                name: ["StatementModule_I","ResolutionModule_GS","anspro_formed_GS"],
                list: ["{}",
                    "{studentAnswer,teacherAnswer}\>\n" +
                    "&(@multiFeedback.splitAnswerEditBox(\"student_answer\",\"@studentAnswer;\"));\n" +
                    "&(@multiFeedback.splitAnswerEditBox(\"teacher_answer\",\"@teacherAnswer;\"));\n" +
                    "<evaluation rule=arith2 student=\"@student_answer1\" teacher=\"@teacher_answer1\">\n" +
                    "<feedback>\n&(@userFeedback.arithGen());\n</feedback>\n&(@itemAnspro.storeFeedback(\"GS.1\"));\n&(@itemAnspro.registerFeedback(\"GS.1\"));",
                    "{studentAnswer,teacherAnswer}\>\n" +
                    "&(@userf.splitReturnValueByName(\"@studentAnswer;\",\".student_\"));\n" +
                    "&(@userf.splitReturnValueByName(\"@teacherAnswer;\",\".teacher_\"));\n" +
                    "<evaluation rule=choice student=\"@student_ans_returned_GS_1\" teacher=\"@teacher_ans_returned_GS_1\">\n" +
                    "<feedback></feedback>\n&(@itemAnspro.storeFeedback(\"GS.1\"));\n&(@itemAnspro.registerFeedback(\"GS.1\"));</function>"]
            }
        },
        evaluation: {
            attrs: {
                rule: ["arith2","function2","polynom2","list2","symbolic2","set2","figed","unit2",
                "match","choice","radiobox","checkbox","standard_form","match","standard_form"],
                student: ["\"@student_answer1\""],
                teacher:["\"@teacher_answer1\""]
            }
        },
        feedback:{},
        catch:{
            attrs: {
                name: ["system.*","type.*","reduce.*","value.*","convention.*"],
                cond: ["(@itemAnspro.checkCatch(convention,DevPow);==1)","(\"@itemAnspro.getCurrentFeedbackField('value');\" == \"Correct\")"],
                redirect: ["{type.}","{reduce.}","{value.}","{convention.}"]
            }
        },
        SEQUENCE: {
            attrs: {
                INDEX: ["history"]
            }
        },
        SIGNATURE: {
            attrs: {
                NAME: ["@autoSequenceSignatureName()"],
                VALUE: ["\"@formatAutoSequenceSignature(@item_instance_values;)\""]
            }
        },
        REQUIREMENT: {},
        requires:{
            attrs: {
                cond: ["()","@testAutoSequenceRequirement(@item_instance_values;)",
                "(@num1;!=@num2;)","(@num1;==@num2;)","(@num1;>@num2;)","(@num1;<@num2;)","(@num1;>=@num2;)","(@num1;<=@num2;)"],
            }
        }
    };
});
