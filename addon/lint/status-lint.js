(function() {

  var statusCache = [];

  function Status(className, container, cm, selectable) {
    this.status = document.createElement('div');
    this.status.className = className;
    this.status.style.display = 'none";'
    container.appendChild(this.status);

    this.nbAnnotation = null;
    if (selectable) {
      this.nbAnnotation = document.createElement('div');
      this.nbAnnotation.className = "CodeMirror-lint-status";
      container.appendChild(this.nbAnnotation);
    }

    this.show = function(nbAnnotations, firstAnnotation) {
      this.status.style.display = 'inline-block'
      if (this.nbAnnotation) {
        this.nbAnnotation.style.display = 'inline';
      }
      if (nbAnnotations > 0)
        this.nbAnnotation.innerHTML = nbAnnotations;
      if (firstAnnotation) {
        this.status.onclick = function() {
          // select the line with the first error/warning
          cm.setSelection(firstAnnotation.from, firstAnnotation.to);
          cm.scrollIntoView(firstAnnotation.from);
        }
      }
    }

    this.hide = function() {
      this.status.style.display = 'none';
      if (this.nbAnnotation) {
        this.nbAnnotation.style.display = 'none';
      }
    }
  }

  CodeMirror.statusLint = function(annotations, container, cm) {

    var containerId = container;
    if (typeof container == "string") {
      container = document.getElementById(containerId);
    } else {
      // HTML container should have an id.
      containerId = container.id;
    }
    if (!containerId)
      return;
    var allStatus = statusCache[containerId];
    if (!allStatus) {
      allStatus = [];
      allStatus.push(new Status("CodeMirror-lint-marker-ok", container, cm,
          false));
      allStatus.push(new Status("CodeMirror-lint-marker-error", container, cm,
          true));
      allStatus.push(new Status("CodeMirror-lint-marker-warning", container,
          cm, true));
      statusCache[containerId] = allStatus;
    }

    var nbErrors = 0;
    var nbWarnings = 0;
    var firstError, firstWarning = null;
    for ( var i = 0; i < annotations.length; i++) {
      var annotation = annotations[i];
      if (annotation.severity == "warning") {
        if (firstWarning == null)
          firstWarning = annotation;
        nbWarnings++;
      } else {
        if (firstError == null)
          firstError = annotation;
        nbErrors++;
      }
    }

    for ( var i = 0; i < allStatus.length; i++) {
      allStatus[i].hide();
    }

    if (nbErrors == 0 && nbWarnings == 0) {
      allStatus[0].show();
    } else {
      if (nbErrors > 0) {
        allStatus[1].show(nbErrors, firstError);
      }
      if (nbWarnings > 0) {
        allStatus[2].show(nbWarnings, firstWarning);
      }
    }
  }

})();
