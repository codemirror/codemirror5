// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

/**
 * Link to the project's GitHub page:
 * https://github.com/drunsinn/CodeMirror
 */

(function(mod) {
    if (typeof exports == "object" && typeof module == "object") // CommonJS
        mod(require("../../lib/codemirror"));
    else if (typeof define == "function" && define.amd) // AMD
        define(["../../lib/codemirror"], mod);
    else // Plain browser env
        mod(CodeMirror);
})(function(CodeMirror) {
    "use strict";

    CodeMirror.defineMode("klartext", function(_config, modeConfig) {

        function testEOLAndSet(source, stateSetter, subState){
            if (source.eol()){
                stateSetter(normal);
            } else {
                stateSetter(normal, subState);
            }
        }

        var rxFloatInt = /[\+-]\d+(?:\.\d+)?/;
        var rxFloatIntQ = /[\+-](\d+(?:\.\d+)?|Q[LR]?\d+)/;
        var rxFloatIntQ_ST = /[\+-](\d+(?:\.\d+)?|Q[LR]?\d+)(?= )/;
		var rxUnsignedFloatInt = /\d+(?:\.\d+)?/;
        var rxLable = /\d+|"[A-Za-z0-9_\.]+"/;
        var rxLableQS = /\d+|"[A-Za-z0-9_]+"|QS\d+/;

        function normal(source, stateSetter) {
            //console.log(source);
            if (source.eatWhile(/[ \t\v\f]/)) {
                return null;
            }

            if (source.sol() == true) { // line numbers
                if (source.match(/\d+ /, true) != null) {
                    return "comment";
                }
            }

            //console.log(source.lineOracle.state.fsub);
            if (source.lineOracle.state.fsub == null) {
                if (source.match(/(BEGIN|END) PGM(?= +)/, true) != null) {
                    stateSetter(normal, "pgmHeadName");
                    return "builtin";
                } else if (source.match(/BLK FORM (0.1 [XYZ]|0.2)(?= +)/, true) != null) {
                    stateSetter(normal, "blkFormBlockAxisXLabel");
                    return "builtin";
                } else if (source.match(/BLK FORM CYLINDER [XYZ](?= )/, true) != null) {
                    stateSetter(normal, "blkFormCylRLabel");
                    return "builtin";
                } else if (source.match(/BLK FORM ROTATION [XYZ](?= )/, true) != null) {
                    stateSetter(normal, "blkFormRotDimLable");
                    return "builtin";
                } else if (source.match(/TOOL CALL(?= +)/, true) != null) {
                    stateSetter(normal, "toolCallToolId");
                    return "builtin";
                } else if (source.match(/CYCL DEF(?= +)/, true) != null) {
                    stateSetter(normal, "cycleDefStart");
                    return "builtin";
                } else if (source.match(/CYCL CALL/, true) != null) {
                    stateSetter(normal, "cyclCallStart");
                    return "builtin";
                } else if (source.match(/TCH PROBE(?= +)/, true) != null) {
                    stateSetter(normal, "cycleDefStart");
                    return "builtin";
                } else if (source.match(/CALL LBL(?= +)/, true) != null) {
                    stateSetter(normal, "lableCall");
                    return "builtin";
                } else if (source.match(/LBL(?= +)/, true) != null) {
                    stateSetter(normal, "lableDef");
                    return "builtin";
                } else if (source.match(/CALL PGM(?= +)/, true) != null) {
                    stateSetter(normal, "pgmCall");
                    return "builtin";
                } else if (source.match(/FN(?= +\d)/, true) != null) {
                    stateSetter(normal, "fnBlockNumber");
                    return "builtin";
                } else if (source.match(/SQL(?= )/, true) != null) {
                    stateSetter(normal, "sqlStart");
                    return "builtin";
                } else if (source.match(/LP(?= +)/, true) != null) {
                    stateSetter(normal, "linPolarBlock");
                    return "builtin";
                } else if (source.match(/L(?= +)/, true) != null) {
                    stateSetter(normal, "linBlock");
                    return "builtin";
                } else if (source.match(/CC(?= +)/, true) != null) {
                    stateSetter(normal, "circleCenterBlock");
                    return "builtin";
                } else if (source.match(/CP(?= +)/, true) != null) {
                    stateSetter(normal, "circlePolarBlock");
                    return "builtin";
                } else if (source.match(/C(?= +)/, true) != null) {
                    stateSetter(normal, "circleBlock");
                    return "builtin";
                } else if (source.match(/RND R/, true) != null) {
                    stateSetter(normal, "cornerRadiusValue");
                    return "builtin";
                } else if (source.match(/CHF(?= \d)/, true) != null) {
                    stateSetter(normal, "cornerChamferValue");
                    return "builtin";
                } else if (source.match(/Q[LR]?\d+(?= =)/, true) != null) {
                    stateSetter(normal, "qFormular");
                    return "number";
                } else if (source.match(/QS?\d+(?= =)/, true) != null) {
                    stateSetter(normal, "qsFormular");
                    return "number";
                } else if (source.match(/FUNCTION MODE(?= )/, true) != null) {
                    stateSetter(normal, "functionMode");
                    return "builtin";
                } else if (source.match(/PLANE(?= )/, true) != null) {
                    stateSetter(normal, "planeMode");
                    return "builtin";
                } else if (source.match(/APPR(?= )/, true) != null) {
                    stateSetter(normal, "apprBlock");
                    return "builtin"; // TODO
                } else if (source.match(/DEP(?= )/, true) != null) {
                    stateSetter(normal, "depBlock");
                    return "builtin"; // TODO
                } else if (source.match(/FUNCTION TURNDATA(?= )/, true) != null) {
                    stateSetter(normal);
                    return "builtin"; // TODO
                } else if (source.match(/FUNCTION SCOPE(?= )/, true) != null) {
                    stateSetter(normal);
                    return "builtin"; // TODO
                } else if (source.match(/DATA READ(?= )/, true) != null) {
                    stateSetter(normal);
                    return "builtin"; // TODO
                } else if (source.match(/WRITE TO PLC KEY(?= )/, true) != null) {
                    stateSetter(normal);
                    return "builtin"; // TODO
                } else if (source.match(/READ FROM PLC KEY(?= )/, true) != null) {
                    stateSetter(normal);
                    return "builtin"; // TODO
                } else if (source.match(/READ KINEMATICS(?= )/, true) != null) {
                    stateSetter(normal);
                    return "builtin"; // TODO
                } else if (source.match(/WRITE KINEMATICS(?= )/, true) != null) {
                    stateSetter(normal);
                    return "builtin"; // TODO
                } else if (source.match(/STOP/, true) != null) {
                    stateSetter(normal);
                    return "builtin"; // TODO
                } else if (source.match(/CYCL QUERY(?= )/, true) != null) {
                    stateSetter(normal);
                    return "builtin"; // TODO
                } else if (source.match(/SEL TABLE(?= )/, true) != null) {
                    stateSetter(normal);
                    return "builtin"; // TODO
                } else if (source.match(/ERROR =/, true) != null) {
                    source.skipToEnd();
                    stateSetter(normal);
                    return "error";
                }
            } else {
                switch (source.lineOracle.state.fsub) {
                    case "pgmHeadName":
                        if (source.match(/[A-Za-z\d_]+/, true) != null) {
                            stateSetter(normal, "pgmHeadUnit");
                            return "string"
                        }
                        break;
                    case "pgmHeadUnit":
                        if (source.match(/MM|INCH/, true) != null) {
                            stateSetter(normal);
                            return "builtin"
                        }
                        break;

                    case "blkFormBlockAxisXLabel":
                        if (source.match(/X/, true) != null) {
                            stateSetter(normal, "blkFormBlockAxisXValue");
                            return "keyword"
                        }
                        break;
                    case "blkFormBlockAxisXValue":
                        if (source.match(rxFloatInt, true) != null) {
                            stateSetter(normal, "blkFormBlockAxisYLabel");
                            return "number"
                        }
                        break;
                    case "blkFormBlockAxisYLabel":
                        if (source.match(/Y/, true) != null) {
                            stateSetter(normal, "blkFormBlockAxisYValue");
                            return "keyword"
                        }
                        break;
                    case "blkFormBlockAxisYValue":
                        if (source.match(rxFloatInt, true) != null) {
                            stateSetter(normal, "blkFormBlockAxisZLabel");
                            return "number"
                        }
                        break;
                    case "blkFormBlockAxisZLabel":
                        if (source.match(/Z/, true) != null) {
                            stateSetter(normal, "blkFormBlockAxisZValue");
                            return "keyword"
                        }
                        break;
                    case "blkFormBlockAxisZValue":
                        if (source.match(rxFloatInt, true) != null) {
                            stateSetter(normal);
                            return "number"
                        }
                        break;

                    case "blkFormCylRLabel":
                        if (source.match(/R(?=\d)/, true) != null) {
                            stateSetter(normal, "blkFormCylRValue");
                            return "keyword"
                        }
                        break;
                    case "blkFormCylRValue":
                        if (source.match(rxUnsignedFloatInt, true) != null) {
                            stateSetter(normal, "blkFormCylLLable");
                            return "number"
                        }
                        break;
                    case "blkFormCylLLable":
                        if (source.match(/L(?=\d)/, true) != null) {
                            stateSetter(normal, "blkFormCylLValue");
                            return "keyword"
                        }
                        break;
                    case "blkFormCylLValue":
                        if (source.match(rxUnsignedFloatInt, true) != null) {
							testEOLAndSet(source, stateSetter, "blkFormCylDISTLable");
                            return "number"
                        }
                        break;
                    case "blkFormCylDISTLable":
                        if (source.match(/DIST(?=[\+-])/, true) != null) {
							stateSetter(normal, "blkFormCylDISTValue");
                            return "keyword"
                        }
                        break;
                    case "blkFormCylDISTValue":
                        if (source.match(rxFloatInt, true) != null) {
							testEOLAndSet(source, stateSetter, "blkFormCylRILable");
                            return "number"
                        }
                        break;
                    case "blkFormCylRILable":
                        if (source.match(/RI(?=\d)/, true) != null) {
							stateSetter(normal, "blkFormCylRIValue");
                            return "keyword"
                        }
                        break;
                    case "blkFormCylRIValue":
                        if (source.match(/\d+/, true) != null) {
							stateSetter(normal);
                            return "number"
                        }
                        break;

                    case "blkFormRotDimLable":
                        if (source.match(/DIM_(?=[DR])/, true) != null) {
							stateSetter(normal, "blkFormRotDimValue");
                            return "builtin"
                        }
                        break;
                    case "blkFormRotDimValue":
                        if (source.match(/[DR](?= )/, true) != null) {
							stateSetter(normal, "blkFormRotLableKeyword");
                            return "keyword"
                        }
                        break;
                    case "blkFormRotLableKeyword":
                        if (source.match(/LBL(?= )/, true) != null) {
							stateSetter(normal, "blkFormRotLableId");
                            return "builtin"
                        }
                        break;
                    case "blkFormRotLableId":
                        if (source.match(rxLable, true) != null) {
							stateSetter(normal);
                            return "string"
                        }
                        break;

                    case "toolCallToolId":
                        if (source.match(rxLable, true) != null) {
                            stateSetter(normal, "toolCallSpindleLable");
                            return "number"
                        }
                        break;
                    case "toolCallSpindleLable":
                        if (source.match(/[XYZ]/, true) != null) {
                            testEOLAndSet(source, stateSetter, "toolCallSpindleSpeedLable");
                            return "number"
                        }
                        break;
                    case "toolCallSpindleSpeedLable":
                        if (source.match(/S/, true) != null) {
                            stateSetter(normal, "toolCallSpindleSpeedValue");
                            return "keyword"
                        }
                        break;
                    case "toolCallSpindleSpeedValue":
                        if (source.match(/\d+/, true) != null) {
                            testEOLAndSet(source, stateSetter, "toolCallSpindleFeedLable");
                            return "number"
                        }
                        break;
                    case "toolCallSpindleFeedLable":
                        if (source.match(/F/, true) != null) {
                            stateSetter(normal, "toolCallSpindleFeedValue");
                            return "keyword"
                        }
                        break;
                    case "toolCallSpindleFeedValue":
                        if (source.match(/\d+/, true) != null) {
                            stateSetter(normal);
                            return "number"
                        }
                        break;

                    case "cycleDefStart":
                        if (source.match(/\d{2,}(?!\.)/, true) != null) {
                            stateSetter(normal, "cycleDefNewStyleStart");
                            return "builtin"
                        } else if (source.match(/\d+\.0/, true) != null) {
                            stateSetter(normal, "cycleDefOldStyleStart");
                            return "builtin"
                        } else if (source.match(/\d+\.[1-9][0-9]*(?= )/, true) != null) {
                            stateSetter(normal, "cycleDefOldStyleContinue");
                            return "builtin"
                        }
                        break;
                    case "cycleDefNewStyleStart":
                        if (source.match(/[\w -\.\/]+ ~/, true) != null) {
                            stateSetter(normal, "cycleDefNewStyleQPar");
                            return "builtin"
                        }
                        break;
                    case "cycleDefNewStyleQPar":
                        if (source.match(/Q\d+(?==)/, true) != null) {
                            stateSetter(normal, "cycleDefNewStyleEq");
                            return "number"
                        }
                        break;
                    case "cycleDefNewStyleEq":
                        if (source.match(/=(?=[\+-])/, true) != null) {
                            stateSetter(normal, "cycleDefNewStyleValue");
                            return "keyword"
                        }
                        break;
                    case "cycleDefNewStyleValue":
                        if (source.match(rxFloatIntQ_ST, true) != null) {
                            stateSetter(normal, "cycleDefNewStyleEnd");
                            return "number"
                        }

                    case "cycleDefNewStyleEnd":
                        if (source.match(/;[\[\]/\w -\.]+ ~/, true) != null) {
                            stateSetter(normal, "cycleDefNewStyleQPar");
                            return "comment"
                        } else if (source.match(/;[\[\]/\w -\.]+(?! ~)/, true) != null) {
                            stateSetter(normal);
                            return "comment"
                        }
                        break;
                    case "cycleDefOldStyleStart":
                        if (source.match(/[A-Z ]+/, true) != null) {
                            stateSetter(normal);
                            return "builtin"
                        }
                        break;
                    case "cycleDefOldStyleContinue":
                        source.skipToEnd();
                        stateSetter(normal);
                        return "comment";
                        // if (source.match(/[A-Z \d\+-:]+/, true) != null) {
                        //     stateSetter(normal, "cycleDefStart");
                        //     return "comment";
                        // } else {
                        //     stateSetter(normal);
                        //     return "comment";
                        // }
                        break;

                    case "cyclCallStart":
						if (source.match(/M(?=\d)/, true)) {
                            stateSetter(normal, "cyclCallFunctionValue");
                            return "keyword";
                        } else {
                            stateSetter(normal);
                            return "error";
                        }
                        break;
                    case "cyclCallFunctionValue":
                        if (source.match(/\d+/, true) != null) {
                            stateSetter(normal, "cyclCallStart");
                            return "number"
                        } else {
                            stateSetter(normal);
                            return "error";
                        }
                        break;

                    case "lableCall":
                        if (source.match(rxLable, true) != null) {
                            stateSetter(normal);
                            return "keyword"
                        }
                        break;

                    case "lableDef":
                        if (source.match(rxLable, true) != null) {
                            stateSetter(normal);
                            return "keyword"
                        }
                        break;

                    case "pgmCall":
                        if (source.match(/[\w\.\\_-]+\.[Hh]/, true) != null) {
                            stateSetter(normal);
                            return "string"
                        }
                        break;

                    case "fnBlockNumber":
                        if (source.match(/0:(?= )/, true) != null) {
                            stateSetter(normal, "fnBlock1QPar");
                            return "number"
                        } else if (source.match(/(9|10|11):(?= )/, true) != null) {
                            stateSetter(normal, "fnBlock10Keyword");
                            return "number"
                        } else if (source.match(/18:(?= )/, true) != null) {
                            stateSetter(normal, "fnBlock18Keyword");
                            return "number"
                        } else if (source.match(/20:(?= )/, true) != null) {
                            stateSetter(normal, "fnBlock20Keyword");
                            return "number"
                        } else if (source.match(/\d+:(?= )/, true) != null) {
                            stateSetter(normal);
                            source.skipToEnd();
                            return "error"
                        }
                        break;

                    case "fnBlock1QPar":
                        if (source.match(/Q\d+(?= )/, true) != null) {
                            stateSetter(normal, "fnBlock1Eq");
                            return "integer"
                        }
                        break;
                    case "fnBlock1Eq":
                        if (source.match(/=(?=[\+-])/, true) != null) {
                            stateSetter(normal, "fnBlock1Value");
                            return "builtin"
                        }
                        break;
                    case "fnBlock1Value":
                        if (source.match(rxFloatInt, true) != null) {
                            stateSetter(normal);
                            return "number"
                        }
                        break;

                    case "fnBlock10Keyword":
                        if (source.match(/IF(?= )/, true) != null) {
                            stateSetter(normal, "fnBlock10Par1");
                            return "keyword"
                        }
                        break;
                    case "fnBlock10Par1":
                        if (source.match(rxFloatIntQ, true) != null) {
                            stateSetter(normal, "fnBlock10NE");
                            return "integer"
                        }
                        break;
                    case "fnBlock10NE":
                        if (source.match(/NE|GT|EQU(?= )/, true) != null) {
                            stateSetter(normal, "fnBlock10Par2");
                            return "keyword"
                        }
                        break;
                    case "fnBlock10Par2":
                        if (source.match(rxFloatIntQ_ST, true) != null) {
                            stateSetter(normal, "fnBlock10Goto");
                            return "integer"
                        }
                        break;
                    case "fnBlock10Goto":
                        if (source.match(/GOTO LBL(?= )/, true) != null) {
                            stateSetter(normal, "fnBlock10Lable");
                            return "keyword"
                        }
                        break;
                    case "fnBlock10Lable":
                        if (source.match(rxLableQS, true) != null) {
                            stateSetter(normal);
                            return "keyword"
                        }
                        break;


                    case "fnBlock18Keyword":
                        if (source.match(/SYSREAD(?= )/, true) != null) {
                            stateSetter(normal, "fnBlock18QPar");
                            return "keyword"
                        }
                        break;
                    case "fnBlock18QPar":
                        if (source.match(/Q[L]?\d+(?= )/, true) != null) {
                            stateSetter(normal, "fnBlock18EQ");
                            return "integer"
                        }
                        break;
                    case "fnBlock18EQ":
                        if (source.match(/\=(?= )/, true) != null) {
                            stateSetter(normal, "fnBlock18IDKey");
                            return "builtin"
                        }
                        break;

                    case "fnBlock18IDKey":
                        if (source.match(/ID(?=\d+)/, true) != null) {
                            stateSetter(normal, "fnBlock18IDValue");
                            return "keyword"
                        }
                        break;
                    case "fnBlock18IDValue":
                        if (source.match(/\d+(?= )/, true) != null) {
                            stateSetter(normal, "fnBlock18NrKey");
                            return "integer"
                        }
                        break;

                    case "fnBlock18NrKey":
                        if (source.match(/NR(?=\d+)/, true) != null) {
                            stateSetter(normal, "fnBlock18NrValue");
                            return "keyword"
                        }
                        break;
                    case "fnBlock18NrValue":
                        if (source.match(/\d+(?= )/, true) != null) {
                            stateSetter(normal);
                            return "integer"
                        }
                        break;


                    case "fnBlock20Keyword":
                        if (source.match(/WAIT FOR(?= )/, true) != null) {
                            stateSetter(normal, "fnBlock20Type");
                            return "keyword"
                        }
                        break;
                    case "fnBlock20Type":
                        if (source.match(/SYNC/, true) != null) {
                            stateSetter(normal);
                            return "builtin"
                        } else if (source.match(/[A-Za-z0-9_\=]+(?=)/, true) != null){
                            stateSetter(normal);
                            return "integer"
                        }
                        break;



                    case "sqlStart":
                        if (source.match(/FETCH(?= )/, true)) {
                            stateSetter(normal, "sqlQBevorHandle");
                            return "keyword";
                        } else if (source.match(/BIND(?= )/, true)) {
                            stateSetter(normal, "sqlBind");
                            return "keyword";
                        } else if (source.match(/ROLLBACK(?= )/, true)) {
                            stateSetter(normal, "sqlQBevorHandle");
                            return "keyword";
                        } else if (source.match(/UPDATE(?= )/, true)) {
                            stateSetter(normal, "sqlQBevorHandle");
                            return "keyword";
                        } else if (source.match(/COMMIT(?= )/, true)) {
                            stateSetter(normal, "sqlQBevorHandle");
                            return "keyword";
                        } else if (source.match(/INSERT(?= )/, true)) {
                            stateSetter(normal, "sqlQBevorHandle");
                            return "keyword";
                        } else if (source.match(/SELECT(?= )/, true)) {
                            stateSetter(normal, "sqlSelect");
                            return "keyword";
                        } else if (source.match(/QL?\d+(?= )/, true)) {
                            stateSetter(normal, "sqlStatement");
                            return "number";
                        } else {
                            stateSetter(normal);
                            return "error";
                        }
                        break;
                    case "sqlBind":
                        if (source.match(/Q[LS]?\d+(?= ")/, true) != null) {
                            stateSetter(normal, "sqlColumnName");
                            return "number"
                        } else if (source.match(/Q[LS]?\d+(?! ")/, true)) {
                            stateSetter(normal);
                            return "number";
                        }
                        break;
                    case "sqlColumnName":
                        if (source.match(/"[\w\._]+"/, true) != null) {
                            stateSetter(normal);
                            return "string"
                        }
                        break;
                    case "sqlSelect":
                        if (source.match(/Q[LS]?\d+(?= )/, true) != null) {
                            stateSetter(normal, "sqlStatement");
                            return "number"
                        }
                        break;
                    case "sqlStatement":
                        if (source.match(/"[\w \d=:'\\_\.,\(\)]+"/, true) != null) {
                            stateSetter(normal);
                            return "string"
                        }
                        break;
                    case "sqlQBevorHandle":
                        if (source.match(/Q[LS]?\d+(?= H)/, true) != null) {
                            stateSetter(normal, "sqlHandle");
                            return "number"
                        }
                        break;
                    case "sqlHandle":
                        if (source.match(/HANDLE(?= )/, true) != null) {
                            stateSetter(normal, "sqlHandleBevorQ");
                            return "keyword"
                        }
                        break;
                    case "sqlHandleBevorQ":
                        if (source.match(/Q[LS]?\d+(?= IN)/, true) != null) {
                            stateSetter(normal, "sqlHandleIndex");
                            return "number"
                        } else if (source.match(/Q[LS]?\d+/, true) != null) {
                            stateSetter(normal);
                            return "number"
                        }
                        break;
                    case "sqlHandleIndex":
                        if (source.match(/INDEX(?=[\+\d])/, true) != null) {
                            stateSetter(normal, "sqlHandleQAfterIndex");
                            return "keyword"
                        }
                        break;
                    case "sqlHandleQAfterIndex":
                        if (source.match(/[\+-]Q[LS]?\d+|\d+/, true) != null) {
                            stateSetter(normal);
                            return "number"
                        }
                        break;

                    case "linBlock":
                        if (source.match(/I?[ABCXYZ](?=[\+-])/, true)) {
                            stateSetter(normal, "linBlockAxisValue");
                            return "keyword";
                        } else if (source.match(/R(?=[LR0])/, true)) {
                            stateSetter(normal, "linBlockConturValue");
                            return "keyword";
                        } else if (source.match(/F(?=[\d|M])/, true)) {
                            stateSetter(normal, "linBlockFeedValue");
                            return "keyword";
                        } else if (source.match(/M(?=\d)/, true)) {
                            stateSetter(normal, "linBlockFunctionValue");
                            return "keyword";
                        } else {
                            stateSetter(normal);
                            return "error";
                        }
                        break;
                    case "linBlockAxisValue":
                        if (source.match(rxFloatIntQ, true) != null) {
                            stateSetter(normal, "linBlock");
                            return "number"
                        } else {
                            stateSetter(normal);
                            return "error";
                        }
                        break;
                    case "linBlockConturValue":
                        if (source.match(/[LR0]/, true) != null) {
                            stateSetter(normal, "linBlock");
                            return "integer"
                        } else {
                            stateSetter(normal);
                            return "error";
                        }
                        break;
                    case "linBlockFeedValue":
                        if (source.match(/\d+/, true) != null) {
                            stateSetter(normal, "linBlock");
                            return "number"
                        } else if (source.match(/MAX/, true) != null) {
                            stateSetter(normal, "linBlock");
                            return "number"
                        } else {
                            stateSetter(normal);
                            return "error";
                        }
                        break;
                    case "linBlockFunctionValue":
                        if (source.match(/\d+/, true) != null) {
                            stateSetter(normal, "linBlock");
                            return "number"
                        } else {
                            stateSetter(normal);
                            return "error";
                        }
                        break;


                    case "linPolarBlock":
                        if (source.match(/I?P[RA](?=[\+-])/, true)) {
                            stateSetter(normal, "linPolarBlockAxisValue");
                            return "keyword";
                        } else if (source.match(/R(?=[LR0])/, true)) {
                            stateSetter(normal, "linPolarBlockConturValue");
                            return "keyword";
                        } else if (source.match(/F(?=[\d|M])/, true)) {
                            stateSetter(normal, "linPolarBlockFeedValue");
                            return "keyword";
                        } else if (source.match(/M(?=\d)/, true)) {
                            stateSetter(normal, "linPolarBlockFunctionValue");
                            return "keyword";
                        } else {
                            stateSetter(normal);
                            return "error";
                        }
                        break;
                    case "linPolarBlockAxisValue":
                        if (source.match(rxFloatIntQ, true) != null) {
                            stateSetter(normal, "linPolarBlock");
                            return "number"
                        } else {
                            stateSetter(normal);
                            return "error";
                        }
                        break;
                    case "linPolarBlockConturValue":
                        if (source.match(/[LR0]/, true) != null) {
                            stateSetter(normal, "linBlock");
                            return "integer"
                        } else {
                            stateSetter(normal);
                            return "error";
                        }
                        break;
                    case "linPolarBlockFeedValue":
                        if (source.match(/\d+/, true) != null) {
                            stateSetter(normal, "linPolarBlock");
                            return "number"
                        } else if (source.match(/MAX/, true) != null) {
                            stateSetter(normal, "linPolarBlock");
                            return "number"
                        } else {
                            stateSetter(normal);
                            return "error";
                        }
                        break;
                    case "linPolarBlockFunctionValue":
                        if (source.match(/\d+/, true) != null) {
                            stateSetter(normal, "linPolarBlock");
                            return "number"
                        } else {
                            stateSetter(normal);
                            return "error";
                        }
                        break;


                    case "circleCenterBlock":
                        if (source.match(/[XYZ](?=[\+-])/, true)) {
                            stateSetter(normal, "circleCenterBlockAxisValue");
                            return "keyword";
                        }
                        break;
                    case "circleCenterBlockAxisValue":
                        if (source.match(rxFloatIntQ, true) != null) {
                            testEOLAndSet(source, stateSetter, "circleCenterBlock");
                            return "number"
                        }
                        break;





                    case "circlePolarBlock":
                        if (source.match(/I?P[RA](?=[\+-])/, true)) {
                            stateSetter(normal, "circlePolarBlockAxisValue");
                            return "keyword";
                        } else if (source.match(/DR(?=[\+-])/, true)) {
                            stateSetter(normal, "circlePolarBlockRadialDirectionValue");
                            return "keyword";
                        } else if (source.match(/R(?=[LR0])/, true)) {
                            stateSetter(normal, "circlePolarBlockConturValue");
                            return "keyword";
                        }else if (source.match(/F(?=[\d|M])/, true)) {
                            stateSetter(normal, "circlePolarBlockFeedValue");
                            return "keyword";
                        } else if (source.match(/M(?=\d)/, true)) {
                            stateSetter(normal, "circlePolarBlockFunctionValue");
                            return "keyword";
                        } else {
                            stateSetter(normal);
                            return "error";
                        }
                        break;
                    case "circlePolarBlockAxisValue":
                        if (source.match(rxFloatIntQ, true) != null) {
                            stateSetter(normal, "circlePolarBlock");
                            return "number"
                        } else {
                            stateSetter(normal);
                            return "error";
                        }
                        break;
                    case "circlePolarBlockRadialDirectionValue":
                        if (source.match(/[\+-]/, true) != null) {
                            stateSetter(normal, "circlePolarBlock");
                            return "integer"
                        } else {
                            stateSetter(normal);
                            return "error";
                        }
                        break;
                    case "circlePolarBlockConturValue":
                        if (source.match(/[LR0]/, true) != null) {
                            stateSetter(normal, "linBlock");
                            return "integer"
                        } else {
                            stateSetter(normal);
                            return "error";
                        }
                        break;
                    case "circlePolarBlockFeedValue":
                        if (source.match(/\d+/, true) != null) {
                            stateSetter(normal, "circlePolarBlock");
                            return "number"
                        } else if (source.match(/MAX/, true) != null) {
                            stateSetter(normal, "circlePolarBlock");
                            return "number"
                        } else {
                            stateSetter(normal);
                            return "error";
                        }
                        break;
                    case "circlePolarBlockFunctionValue":
                        if (source.match(/\d+/, true) != null) {
                            stateSetter(normal, "circlePolarBlock");
                            return "number"
                        } else {
                            stateSetter(normal);
                            return "error";
                        }
                        break;




                    case "circleBlock":
                        if (source.match(/[XYZ](?=[\+-])/, true)) {
                            stateSetter(normal, "circleBlockAxisValue");
                            return "keyword";
                        }
                        break;
                    case "circleBlockAxisValue":
                        if (source.match(rxFloatIntQ, true) != null) {
                            testEOLAndSet(source, stateSetter, "circleCenterBlock");
                            return "number"
                        }
                        break;





                    case "cornerRadiusValue":
                        if (source.match(rxUnsignedFloatInt, true) != null) {
                            stateSetter(normal);
                            return "number"
                        }
                        break;

                    case "cornerChamferValue":
                        if (source.match(rxUnsignedFloatInt, true) != null) {
                            stateSetter(normal);
                            return "number"
                        }
                        break;

                    case "qFormular":
                        if (source.match(/=(?= )/, true) != null) {
                            stateSetter(normal, "qFormularOperation");
                            return "builtin"
                        }
                        break;
                    case "qFormularOperation":
                        if (source.match(/\d+(?:\.\d+)?/, true)) {
                            testEOLAndSet(source, stateSetter, "qFormularOperation");
                            return "number";
                        } else if (source.match(/[\+-\/\*]/, true)) {
                            stateSetter(normal, "qFormularOperation");
                            return "keyword";
                        } else if (source.match(/(ATAN|FRAC|PI|INT|SIN|COS)(?= )/, true)) {
                            stateSetter(normal, "qFormularOperation");
                            return "builtin";
                        } else if (source.match(/TONUMB\( SRC_/, true)) {
                            stateSetter(normal, "qFormularOperation");
                            return "builtin";
                        } else if (source.match(/CFGREAD\( KEY_/, true)) {
                            stateSetter(normal, "qFormularOperation");
                            return "builtin";
                        } else if (source.match(/Q[LR]?\d+/, true)) {
                            testEOLAndSet(source, stateSetter, "qFormularOperation");
                            return "number";
                        } else {
                            stateSetter(normal);
                            return "error";
                        }
                        break;



                    case "qsFormular":
                        if (source.match(/=(?= )/, true) != null) {
                            stateSetter(normal, "qsFormularOperation");
                            return "builtin"
                        }
                        break;
                    case "qsFormularOperation":
                        if (source.match(/QS?\d+/, true)) {
                            testEOLAndSet(source, stateSetter, "qsFormularOperation");
                            return "number";
                        } else if (source.match(/TOCHAR\( DAT/, true)) {
                            stateSetter(normal, "qsFormularOperation");
                            return "builtin";
                        } else if (source.match(/SUBSTR\( SRC_/, true)) {
                            stateSetter(normal, "qsFormularOperation");
                            return "builtin";
                        } else if (source.match(/"[\w _-]+"/, true)) {
                            testEOLAndSet(source, stateSetter, "qsFormularOperation");
                            return "string";
                        } else if (source.match(/SYSSTR\( ID/, true)) {
                            stateSetter(normal, "qsFormularOperation");
                            return "string";
                        } else if (source.match(/\|\|/, true)) {
                            stateSetter(normal, "qsFormularOperation");
                            return "builtin";
                        } else {
                            stateSetter(normal);
                            return "error";
                        }
                        break;

                    case "functionMode":
                        if (source.match(/MILL|TURN/, true) != null) {
                            stateSetter(normal);
                            return "keyword"
                        }
                        break;

                    case "planeMode":
                        if (source.match(/RESET MOVE(?= )/, true) != null) {
                            stateSetter(normal);
                            return "keyword"
                        } else if (source.match(/VECTOR(?= )/, true) != null) {
                            stateSetter(normal);
                            return "keyword"
                        }
                        break;


                    case "apprBlock":
                        if (source.match(/LT(?= )/, true) != null) {
                            stateSetter(normal);
                            return "keyword"
                        } else if (source.match(/LN(?= )/, true) != null) {
                            stateSetter(normal);
                            return "keyword"
                        } else if (source.match(/CT(?= )/, true) != null) {
                            stateSetter(normal);
                            return "keyword"
                        } else if (source.match(/LCT(?= )/, true) != null) {
                            stateSetter(normal);
                            return "keyword"
                        }
                        break;

                    case "depBlock":
                        if (source.match(/LT(?= )/, true) != null) {
                            stateSetter(normal);
                            return "keyword"
                        } else if (source.match(/LN(?= )/, true) != null) {
                            stateSetter(normal);
                            return "keyword"
                        } else if (source.match(/CT(?= )/, true) != null) {
                            stateSetter(normal);
                            return "keyword"
                        } else if (source.match(/LCT(?= )/, true) != null) {
                            stateSetter(normal);
                            return "keyword"
                        }
                        break;



                    default:
                        stateSetter(normal);
                        return "error";
                }
            }

            var ch = source.next();
            if (/[;*]/.test(ch)) {
                if (ch == ';') { // handle klartext comments
                    source.skipToEnd();
					stateSetter(normal);
                    return "comment";
                } else if (ch == '*') {
                    source.skipToEnd(); // handle klartext structuring block
					stateSetter(normal);
                    return "comment";
                }
            }

            stateSetter(normal);
            return "error";
        }

        return {
            startState: function() {
                return {
                    f: normal,
                    fsub: null
                };
            },

            copyState: function(state) {
                return {
                    f: state.f,
                    fsub: state.fsub
                };
            },

            token: function(stream, state) {
                var t = state.f(stream, function(newState, newSubState) {
                    newSubState = typeof newSubState !== 'undefined' ? newSubState : null;
                    state.f = newState;
                    state.fsub = newSubState;
                });
                return t;
            },

            lineComment: ";"
        };
    });

    CodeMirror.defineMIME("text/x-klartext", "klartext");

});
