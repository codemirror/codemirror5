import { copyObj, createObj } from "./util/misc";

// Known modes, by name and by MIME
export var modes = {}, mimeModes = {};

// Extra arguments are stored as the mode's dependencies, which is
// used by (legacy) mechanisms like loadmode.js to automatically
// load a mode. (Preferred mechanism is the require/define calls.)
export function defineMode(name, mode) {
  if (arguments.length > 2)
    mode.dependencies = Array.prototype.slice.call(arguments, 2);
  modes[name] = mode;
}

export function defineMIME(mime, spec) {
  mimeModes[mime] = spec;
}

// Given a MIME type, a {name, ...options} config object, or a name
// string, return a mode config object.
export function resolveMode(spec) {
  if (typeof spec == "string" && mimeModes.hasOwnProperty(spec)) {
    spec = mimeModes[spec];
  } else if (spec && typeof spec.name == "string" && mimeModes.hasOwnProperty(spec.name)) {
    var found = mimeModes[spec.name];
    if (typeof found == "string") found = {name: found};
    spec = createObj(found, spec);
    spec.name = found.name;
  } else if (typeof spec == "string" && /^[\w\-]+\/[\w\-]+\+xml$/.test(spec)) {
    return resolveMode("application/xml");
  } else if (typeof spec == "string" && /^[\w\-]+\/[\w\-]+\+json$/.test(spec)) {
    return resolveMode("application/json");
  }
  if (typeof spec == "string") return {name: spec};
  else return spec || {name: "null"};
}

// Given a mode spec (anything that resolveMode accepts), find and
// initialize an actual mode object.
export function getMode(options, spec) {
  var spec = resolveMode(spec);
  var mfactory = modes[spec.name];
  if (!mfactory) return getMode(options, "text/plain");
  var modeObj = mfactory(options, spec);
  if (modeExtensions.hasOwnProperty(spec.name)) {
    var exts = modeExtensions[spec.name];
    for (var prop in exts) {
      if (!exts.hasOwnProperty(prop)) continue;
      if (modeObj.hasOwnProperty(prop)) modeObj["_" + prop] = modeObj[prop];
      modeObj[prop] = exts[prop];
    }
  }
  modeObj.name = spec.name;
  if (spec.helperType) modeObj.helperType = spec.helperType;
  if (spec.modeProps) for (var prop in spec.modeProps)
    modeObj[prop] = spec.modeProps[prop];

  return modeObj;
}

// This can be used to attach properties to mode objects from
// outside the actual mode definition.
export var modeExtensions = {};
export function extendMode(mode, properties) {
  var exts = modeExtensions.hasOwnProperty(mode) ? modeExtensions[mode] : (modeExtensions[mode] = {});
  copyObj(properties, exts);
}

export function copyState(mode, state) {
  if (state === true) return state;
  if (mode.copyState) return mode.copyState(state);
  var nstate = {};
  for (var n in state) {
    var val = state[n];
    if (val instanceof Array) val = val.concat([]);
    nstate[n] = val;
  }
  return nstate;
}

// Given a mode and a state (for that mode), find the inner mode and
// state at the position that the state refers to.
export function innerMode(mode, state) {
  while (mode.innerMode) {
    var info = mode.innerMode(state);
    if (!info || info.mode == mode) break;
    state = info.state;
    mode = info.mode;
  }
  return info || {mode: mode, state: state};
}

export function startState(mode, a1, a2) {
  return mode.startState ? mode.startState(a1, a2) : true;
}
