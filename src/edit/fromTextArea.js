import { CodeMirror } from "./CodeMirror"
import { activeElt } from "../util/dom"
import { off, on } from "../util/event"
import { copyObj } from "../util/misc"

export function fromTextArea(textarea, options) {
  options = options ? copyObj(options) : {}
  options.value = textarea.value
  if (!options.tabindex && textarea.tabIndex)
    options.tabindex = textarea.tabIndex
  if (!options.placeholder && textarea.placeholder)
    options.placeholder = textarea.placeholder
  // Set autofocus to true if this textarea is focused, or if it has
  // autofocus and no other element is focused.
  if (options.autofocus == null) {
    var hasFocus = activeElt()
    options.autofocus = hasFocus == textarea ||
      textarea.getAttribute("autofocus") != null && hasFocus == document.body
  }

  function save() {textarea.value = cm.getValue()}
  if (textarea.form) {
    on(textarea.form, "submit", save)
    // Deplorable hack to make the submit method do the right thing.
    if (!options.leaveSubmitMethodAlone) {
      var form = textarea.form, realSubmit = form.submit
      try {
        var wrappedSubmit = form.submit = function() {
          save()
          form.submit = realSubmit
          form.submit()
          form.submit = wrappedSubmit
        }
      } catch(e) {}
    }
  }

  options.finishInit = function(cm) {
    cm.save = save
    cm.getTextArea = function() { return textarea }
    cm.toTextArea = function() {
      cm.toTextArea = isNaN // Prevent this from being ran twice
      save()
      textarea.parentNode.removeChild(cm.getWrapperElement())
      textarea.style.display = ""
      if (textarea.form) {
        off(textarea.form, "submit", save)
        if (typeof textarea.form.submit == "function")
          textarea.form.submit = realSubmit
      }
    }
  }

  textarea.style.display = "none"
  var cm = CodeMirror(function(node) {
    textarea.parentNode.insertBefore(node, textarea.nextSibling)
  }, options)
  return cm
}
