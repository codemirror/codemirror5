// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

(function(mod) {
    if (typeof exports == "object" && typeof module == "object") // CommonJS
        mod(require("../../lib/codemirror"));
    else if (typeof define == "function" && define.amd) // AMD
        define(["../../lib/codemirror"], mod);
    else // Plain browser env
        mod(CodeMirror);
})(function(CodeMirror) {
    "use strict";

    CodeMirror.defineMode("asl", function() {
        var keywords = words([
            'Default','DefinitionBlock','Device','Method','Else','ElseIf','For','Function','If','Include','Method','Return',
            'Scope','Switch','Case','While','Break','BreakPoint','Continue','NoOp','Wait','True','False'
        ]);
        var strNumbers = words([
            'One', 'Ones', 'Zero'
        ]);
        var properties = words([
            'AccessAs','Acquire','Alias','BankField','Buffer','Concatenate','ConcatenateResTemplate',
            'CondRefOf','Connection','CopyObject','CreateBitField','CreateByteField','CreateDWordField',
            'CreateField','CreateQWordField','CreateWordField','DataTableRegion','Debug','Processor',
            'DMA','DWordIO','DWordMemory','DWordSpace','EisaId','EISAID','EndDependentFn','Event','ExtendedIO',
            'ExtendedMemory','ExtendedSpace','External','Fatal','Field','FindSetLeftBit','FindSetRightBit',
            'FixedDMA','FixedIO','Fprintf','FromBCD','GpioInt','GpioIo','I2CSerialBusV2','IndexField',
            'Interrupt','IO','IRQ','IRQNoFlags','Load','LoadTable','Match','Memory24','Memory32','Memory32Fixed',
            'Mid','Mutex','Name','Notify','Offset','ObjectType','OperationRegion','Package','PowerResource','Printf',
            'QWordIO','QWordMemory','QWordSpace','RawDataBuffer','Register','Release','Reset','ResourceTemplate',
            'Signal','SizeOf','Sleep','SPISerialBusV2','Stall','StartDependentFn','StartDependentFnNoPri',
            'Store','ThermalZone','Timer','ToBCD','ToBuffer','ToDecimalString','ToInteger','ToPLD','ToString',
            'ToUUID','UARTSerialBusV2','Unicode','Unload','VendorLong','VendorShort','WordBusNumber','WordIO',
            'WordSpace'
        ]);
        var builtin = words([
            '__FILE__','__PATH__','__LINE__','__DATE__','__IASL__',
            '#define','#elif','#else','#endif','#error','#if','#ifdef','#ifndef','#include','#includebuffer',
            '#line','#pragma','#undef','#warning'
        ]);
        var storageTypes = words([
            'UnknownObj','IntObj','StrObj','BuffObj','PkgObj','FieldUnitObj','DeviceObj',
            'EventObj','MethodObj','MutexObj','OpRegionObj','PowerResObj','ProcessorObj',
            'ThermalZoneObj','BuffFieldObj','DDBHandleObj'
        ]);
        var atoms = words([
            'AttribQuick','AttribSendReceive','AttribByte','AttribBytes','AttribRawBytes',
            'AttribRawProcessBytes','AttribWord','AttribBlock','AttribProcessCall','AttribBlockProcessCall',
            'AnyAcc','ByteAcc','WordAcc','DWordAcc','QWordAcc','BufferAcc',
            'AddressRangeMemory','AddressRangeReserved','AddressRangeNVS','AddressRangeACPI',
            'RegionSpaceKeyword','FFixedHW','PCC',
            'AddressingMode7Bit','AddressingMode10Bit',
            'DataBitsFive','DataBitsSix','DataBitsSeven','DataBitsEight','DataBitsNine',
            'BusMaster','NotBusMaster',
            'ClockPhaseFirst','ClockPhaseSecond','ClockPolarityLow','ClockPolarityHigh',
            'SubDecode','PosDecode',
            'BigEndianing','LittleEndian',
            'FlowControlNone','FlowControlXon','FlowControlHardware',
            'Edge','Level','ActiveHigh','ActiveLow','ActiveBoth','Decode16','Decode10',
            'IoRestrictionNone','IoRestrictionInputOnly','IoRestrictionOutputOnly',
            'IoRestrictionNoneAndPreserve','Lock','NoLock','MTR','MEQ','MLE','MLT','MGE','MGT',
            'MaxFixed','MaxNotFixed','Cacheable','WriteCombining','Prefetchable','NonCacheable',
            'MinFixed','MinNotFixed',
            'ParityTypeNone','ParityTypeSpace','ParityTypeMark','ParityTypeOdd','ParityTypeEven',
            'PullDefault','PullUp','PullDown','PullNone','PolarityHigh','PolarityLow',
            'ISAOnlyRanges','NonISAOnlyRanges','EntireRange','ReadWrite','ReadOnly',
            'UserDefRegionSpace','SystemIO','SystemMemory','PCI_Config','EmbeddedControl',
            'SMBus','SystemCMOS','PciBarTarget','IPMI','GeneralPurposeIO','GenericSerialBus',
            'ResourceConsumer','ResourceProducer','Serialized','NotSerialized',
            'Shared','Exclusive','SharedAndWake','ExclusiveAndWake','ControllerInitiated','DeviceInitiated',
            'StopBitsZero','StopBitsOne','StopBitsOnePlusHalf','StopBitsTwo',
            'Width8Bit','Width16Bit','Width32Bit','Width64Bit','Width128Bit','Width256Bit',
            'SparseTranslation','DenseTranslation','TypeTranslation','TypeStatic',
            'Preserve','WriteAsOnes','WriteAsZeros','Transfer8','Transfer16','Transfer8_16',
            'ThreeWireMode','FourWireMode'
        ]);
        var operators = words([
            'Add','Decrement','Divide','Increment','Subtract','Index','LAnd','LEqual','LGreater','LGreaterEqual',
            'LLess','LLessEqual','LNot','LNotEqual','LOr','Mod','Multiply','NAnd','NOr','Not','Or','And','XOr',
            'RefOf','DerefOf','Revision','ShiftLeft','ShiftRight'
        ]);
        var isOperatorChar = /[!\~\*/%+-<>\^|=&]/;
        var isVariable = /Arg[0-9]+$|Local[0-9]+$/;

        function tokenBase(stream, state) {
            var ch = stream.next();

            switch (ch) {
                case "/": {
                    if (stream.eat("*")) {
                        state.tokenize = tokenComment;
                        return tokenComment(stream, state);

                    } else if (stream.eat("/")) {
                        stream.skipToEnd();
                        return "comment";
                    }
                }
                    break;
                case "[": {
                    state.tokenize = tokenFieldComment;
                    return tokenFieldComment(stream, state);
                }
                    break;
                case '"': {
                    state.tokenize = tokenString(ch);
                    return state.tokenize(stream, state);
                }
                    break;
                default:
                    break;
            }

            if (/[\(\),]/.test(ch)) {
                return null;
            }
            if (/\d/.test(ch)) {
                stream.eatWhile(/[\w\.]/);
                return "number";
            }
            if (isOperatorChar.test(ch)) {
                stream.eatWhile(isOperatorChar);
                return "operator";
            }

            stream.eatWhile(/[\w\$_]/);
            var word = stream.current();

            if (atoms.hasOwnProperty(word)) {
                return 'atom';
            }
            if (operators.hasOwnProperty(word)){
                return 'operator';
            }
            if (strNumbers.hasOwnProperty(word)) {
                return 'number';
            }
            if (keywords.hasOwnProperty(word)){
                return 'keyword';
            }
            if (properties.hasOwnProperty(word)) {
                return 'property';
            }
            if (builtin.hasOwnProperty(word)) {
                return 'builtin';
            }
            if (storageTypes.hasOwnProperty(word)) {
                return 'type';
            }
            if (isVariable.test(word)) {
                return 'variable';
            }
            return null;
        }

        function tokenComment(stream, state) {
            var maybeEnd = false, ch;
            while (ch = stream.next()) {
                if (ch == "/" && maybeEnd) {
                    state.tokenize = null;
                    break;
                }
                maybeEnd = (ch == "*");
            }
            return "comment";
        }

        function tokenFieldComment(stream, state) {
            var ch;
            while (ch = stream.next()) {
                if (ch == "]") {
                    state.tokenize = null;
                    break;
                }
            }
            return "comment";
        }

        function tokenString(quote) {
            return function(stream, state) {
                var escaped = false, next, end = false;
                while ((next = stream.next()) != null) {
                    if (next == quote && !escaped) {
                        end = true;
                        break;
                    }
                    escaped = !escaped && next == "\\";
                }
                if (end || !escaped) state.tokenize = null;
                return "string";
            };
        }

        function words(array) {
            var keys = {};
            for (let i = 0, l = array.length; i < l; ++i) {
                keys[array[i]] = true;
            }
            return keys;
        }

        // Interface
        return {
            startState: function() {
                return {
                    tokenize: null
                };
            },
            token: function(stream, state) {
                if (stream.eatSpace()) return null;
                var style = (state.tokenize || tokenBase)(stream, state);
                return style;
            },

            electricChars: '{}',
            lineComment: '//',
            blockCommentStart: '/*',
            blockCommentEnd: '*/',
            fold: 'brace'
        };
    });

    CodeMirror.defineMIME("text/x-asl", "asl");
});
