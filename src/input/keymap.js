import { flipCtrlCmd, mac, presto } from "../util/browser";
import { map } from "../util/misc";

import { keyNames } from "./keynames";

export var keyMap = {};

keyMap.basic = {
  "Left": "goCharLeft", "Right": "goCharRight", "Up": "goLineUp", "Down": "goLineDown",
  "End": "goLineEnd", "Home": "goLineStartSmart", "PageUp": "goPageUp", "PageDown": "goPageDown",
  "Delete": "delCharAfter", "Backspace": "delCharBefore", "Shift-Backspace": "delCharBefore",
  "Tab": "defaultTab", "Shift-Tab": "indentAuto",
  "Enter": "newlineAndIndent", "Insert": "toggleOverwrite",
  "Esc": "singleSelection"
};
// Note that the save and find-related commands aren't defined by
// default. User code or addons can define them. Unknown commands
// are simply ignored.
keyMap.pcDefault = {
  "Ctrl-A": "selectAll", "Ctrl-D": "deleteLine", "Ctrl-Z": "undo", "Shift-Ctrl-Z": "redo", "Ctrl-Y": "redo",
  "Ctrl-Home": "goDocStart", "Ctrl-End": "goDocEnd", "Ctrl-Up": "goLineUp", "Ctrl-Down": "goLineDown",
  "Ctrl-Left": "goGroupLeft", "Ctrl-Right": "goGroupRight", "Alt-Left": "goLineStart", "Alt-Right": "goLineEnd",
  "Ctrl-Backspace": "delGroupBefore", "Ctrl-Delete": "delGroupAfter", "Ctrl-S": "save", "Ctrl-F": "find",
  "Ctrl-G": "findNext", "Shift-Ctrl-G": "findPrev", "Shift-Ctrl-F": "replace", "Shift-Ctrl-R": "replaceAll",
  "Ctrl-[": "indentLess", "Ctrl-]": "indentMore",
  "Ctrl-U": "undoSelection", "Shift-Ctrl-U": "redoSelection", "Alt-U": "redoSelection",
  fallthrough: "basic"
};
// Very basic readline/emacs-style bindings, which are standard on Mac.
keyMap.emacsy = {
  "Ctrl-F": "goCharRight", "Ctrl-B": "goCharLeft", "Ctrl-P": "goLineUp", "Ctrl-N": "goLineDown",
  "Alt-F": "goWordRight", "Alt-B": "goWordLeft", "Ctrl-A": "goLineStart", "Ctrl-E": "goLineEnd",
  "Ctrl-V": "goPageDown", "Shift-Ctrl-V": "goPageUp", "Ctrl-D": "delCharAfter", "Ctrl-H": "delCharBefore",
  "Alt-D": "delWordAfter", "Alt-Backspace": "delWordBefore", "Ctrl-K": "killLine", "Ctrl-T": "transposeChars",
  "Ctrl-O": "openLine"
};
keyMap.macDefault = {
  "Cmd-A": "selectAll", "Cmd-D": "deleteLine", "Cmd-Z": "undo", "Shift-Cmd-Z": "redo", "Cmd-Y": "redo",
  "Cmd-Home": "goDocStart", "Cmd-Up": "goDocStart", "Cmd-End": "goDocEnd", "Cmd-Down": "goDocEnd", "Alt-Left": "goGroupLeft",
  "Alt-Right": "goGroupRight", "Cmd-Left": "goLineLeft", "Cmd-Right": "goLineRight", "Alt-Backspace": "delGroupBefore",
  "Ctrl-Alt-Backspace": "delGroupAfter", "Alt-Delete": "delGroupAfter", "Cmd-S": "save", "Cmd-F": "find",
  "Cmd-G": "findNext", "Shift-Cmd-G": "findPrev", "Cmd-Alt-F": "replace", "Shift-Cmd-Alt-F": "replaceAll",
  "Cmd-[": "indentLess", "Cmd-]": "indentMore", "Cmd-Backspace": "delWrappedLineLeft", "Cmd-Delete": "delWrappedLineRight",
  "Cmd-U": "undoSelection", "Shift-Cmd-U": "redoSelection", "Ctrl-Up": "goDocStart", "Ctrl-Down": "goDocEnd",
  fallthrough: ["basic", "emacsy"]
};
keyMap["default"] = mac ? keyMap.macDefault : keyMap.pcDefault;

// KEYMAP DISPATCH

function normalizeKeyName(name) {
  var parts = name.split(/-(?!$)/), name = parts[parts.length - 1];
  var alt, ctrl, shift, cmd;
  for (var i = 0; i < parts.length - 1; i++) {
    var mod = parts[i];
    if (/^(cmd|meta|m)$/i.test(mod)) cmd = true;
    else if (/^a(lt)?$/i.test(mod)) alt = true;
    else if (/^(c|ctrl|control)$/i.test(mod)) ctrl = true;
    else if (/^s(hift)$/i.test(mod)) shift = true;
    else throw new Error("Unrecognized modifier name: " + mod);
  }
  if (alt) name = "Alt-" + name;
  if (ctrl) name = "Ctrl-" + name;
  if (cmd) name = "Cmd-" + name;
  if (shift) name = "Shift-" + name;
  return name;
}

// This is a kludge to keep keymaps mostly working as raw objects
// (backwards compatibility) while at the same time support features
// like normalization and multi-stroke key bindings. It compiles a
// new normalized keymap, and then updates the old object to reflect
// this.
export function normalizeKeyMap(keymap) {
  var copy = {};
  for (var keyname in keymap) if (keymap.hasOwnProperty(keyname)) {
    var value = keymap[keyname];
    if (/^(name|fallthrough|(de|at)tach)$/.test(keyname)) continue;
    if (value == "...") { delete keymap[keyname]; continue; }

    var keys = map(keyname.split(" "), normalizeKeyName);
    for (var i = 0; i < keys.length; i++) {
      var val, name;
      if (i == keys.length - 1) {
        name = keys.join(" ");
        val = value;
      } else {
        name = keys.slice(0, i + 1).join(" ");
        val = "...";
      }
      var prev = copy[name];
      if (!prev) copy[name] = val;
      else if (prev != val) throw new Error("Inconsistent bindings for " + name);
    }
    delete keymap[keyname];
  }
  for (var prop in copy) keymap[prop] = copy[prop];
  return keymap;
}

export function lookupKey(key, map, handle, context) {
  map = getKeyMap(map);
  var found = map.call ? map.call(key, context) : map[key];
  if (found === false) return "nothing";
  if (found === "...") return "multi";
  if (found != null && handle(found)) return "handled";

  if (map.fallthrough) {
    if (Object.prototype.toString.call(map.fallthrough) != "[object Array]")
      return lookupKey(key, map.fallthrough, handle, context);
    for (var i = 0; i < map.fallthrough.length; i++) {
      var result = lookupKey(key, map.fallthrough[i], handle, context);
      if (result) return result;
    }
  }
}

// Modifier key presses don't count as 'real' key presses for the
// purpose of keymap fallthrough.
export function isModifierKey(value) {
  var name = typeof value == "string" ? value : keyNames[value.keyCode];
  return name == "Ctrl" || name == "Alt" || name == "Shift" || name == "Mod";
}

// Look up the name of a key as indicated by an event object.
export function keyName(event, noShift) {
  if (presto && event.keyCode == 34 && event["char"]) return false;
  var base = keyNames[event.keyCode], name = base;
  if (name == null || event.altGraphKey) return false;
  if (event.altKey && base != "Alt") name = "Alt-" + name;
  if ((flipCtrlCmd ? event.metaKey : event.ctrlKey) && base != "Ctrl") name = "Ctrl-" + name;
  if ((flipCtrlCmd ? event.ctrlKey : event.metaKey) && base != "Cmd") name = "Cmd-" + name;
  if (!noShift && event.shiftKey && base != "Shift") name = "Shift-" + name;
  return name;
}

export function getKeyMap(val) {
  return typeof val == "string" ? keyMap[val] : val;
}
