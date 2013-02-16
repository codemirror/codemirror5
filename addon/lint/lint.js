CodeMirror.validate = function(cm, collectAnnotations, options) {
	if (!options)
		options = {};

	var GUTTER_ID = "CodeMirror-lints";

	// see
	// http://sixrevisions.com/tutorials/javascript_tutorial/create_lightweight_javascript_tooltip/
	var tooltip = function() {
		var id = 'tt';
		var top = 3;
		var left = 3;
		var maxw = 600;
		var speed = 10;
		var timer = 20;
		var endalpha = 95;
		var alpha = 0;
		//var tt, t, c, b, h;
		var tt, c, h;
		var ie = document.all ? true : false;
		return {
			show : function(v, w, severity) {
				if (tt == null) {
					tt = document.createElement('div');
					tt.setAttribute('id', id);
					tt.className = 'textviewTooltip';
					//t = document.createElement('div');
					//t.setAttribute('id', id + 'top');
					c = document.createElement('div');
					c.setAttribute('id', id + 'cont');
					//b = document.createElement('div');
					//b.setAttribute('id', id + 'bot');
					//tt.appendChild(t);
					tt.appendChild(c);
					//tt.appendChild(b);
					document.body.appendChild(tt);
					tt.style.opacity = 0;
					tt.style.filter = 'alpha(opacity=0)';
					document.onmousemove = this.pos;
				}
				tt.style.display = 'block';
				c.innerHTML = v;
				tt.style.width = w ? w + 'px' : 'auto';
				if (!w && ie) {
					//t.style.display = 'none';
					//b.style.display = 'none';
					tt.style.width = tt.offsetWidth;
					//t.style.display = 'block';
					//b.style.display = 'block';
				}
				if (tt.offsetWidth > maxw) {
					tt.style.width = maxw + 'px'
				}
				h = parseInt(tt.offsetHeight) + top;
				clearInterval(tt.timer);
				tt.timer = setInterval(function() {
					tooltip.fade(1)
				}, timer);
			},
			pos : function(e) {
				var u = ie ? event.clientY + document.documentElement.scrollTop
						: e.pageY;
				var l = ie ? event.clientX
						+ document.documentElement.scrollLeft : e.pageX;
				tt.style.top = (u - h) + 'px';
				tt.style.left = (l + left) + 'px';
			},
			fade : function(d) {
				var a = alpha;
				if ((a != endalpha && d == 1) || (a != 0 && d == -1)) {
					var i = speed;
					if (endalpha - a < speed && d == 1) {
						i = endalpha - a;
					} else if (alpha < speed && d == -1) {
						i = a;
					}
					alpha = a + (i * d);
					tt.style.opacity = alpha * .01;					
					tt.style.filter = 'alpha(opacity=' + alpha + ')';
				} else {
					clearInterval(tt.timer);
					if (d == -1) {
						tt.style.display = 'none'
					} else if (d == 1) {
						tt.style.opacity = 1;
						tt.style.filter = 'alpha(opacity=100)';
					}
				}
			},
			hide : function() {
				clearInterval(tt.timer);
				tt.timer = setInterval(function() {
					tooltip.fade(-1)
				}, timer);
			}
		};
	}();

	function SyntaxErrorHighlightState() {
		this.marked = [];
	}
	function getSyntaxErrorHighlightState(cm) {
		return cm._syntaxErrorHighlightState
				|| (cm._syntaxErrorHighlightState = new SyntaxErrorHighlightState());
	}

	function clearMarks(cm, gutterID) {
		cm.clearGutter(gutterID);
		var state = getSyntaxErrorHighlightState(cm);
		for ( var i = 0; i < state.marked.length; ++i)
			state.marked[i].clear();
		state.marked = [];
	}

	function makeMarker(tooltipLabel, maxSeverity, multiple) {

		var marker = document.createElement("div");
		marker.onmouseover = function() {
			tooltip.show(tooltipLabel, null, maxSeverity);
		};
		marker.onmouseout = function() {
			tooltip.hide();
		};
		marker.className = 'annotation ' + maxSeverity;
		
		var markerHTML= document.createElement("div");
		markerHTML.className = 'annotationHTML ' + maxSeverity;
		marker.appendChild(markerHTML);
		
		if (multiple) {
			var markerHTML= document.createElement("div");
			markerHTML.className = 'annotationHTML overlay';
			marker.appendChild(markerHTML);
		}
		
		return marker;
	}

	var AnnotationsCollector = function() {
		this.linesNumber = [];
		this.linesAnnotations = [];
	};

	AnnotationsCollector.prototype.addAnnotation = function(severity,
			lineStart, charStart, lineEnd, charEnd, description) {

		var annotation = {
			"severity" : severity,
			"lineStart" : lineStart,
			"charStart" : charStart,
			"lineEnd" : lineEnd,
			"charEnd" : charEnd,
			"description" : description
		}
		var annotations = this.linesAnnotations[lineStart];
		if (!annotations) {
			annotations = [];
			this.linesAnnotations[lineStart] = annotations;
			this.linesNumber.push(lineStart);
		}
		annotations.push(annotation);
	};

	function getMaxSeverity(severity1, severity2) {
		// TODO : should be improved to extend severity (today just error and
		// warning are managed)
		if (severity1 == 'error') {
			return severity1;
		}
		return severity2;
	}
	
	function getTooltipLabel(content, multiple) {
		var label = '<div style="height: auto; width: auto;">';		
		if (multiple) {
			label += '<div><em>Multiple Annotations</em></div>';
		}
		label += '<div>';
		label += content;
		label += '</div>';
		label += '</div>';
		return label;
	}
	
	function getTooltipAnnotationLabel(description, severity) {
		var label = '<div>';
		label += '<div class="annotationHTML ' + severity + '">';
		label += '</div>';
		label += '&nbsp;<span style="vertical-align:middle;">';
		label += description;
		label += '</span>';
		label += '</div>';		
		return label;
	}
	
	function makeMarkText(severity, lineStart, charStart, lineEnd, charEnd, annotationLabel) {
		var markClass = 'annotationRange ' + severity;
		var mark = cm.markText({
			line : lineStart,
			ch : charStart
		}, {
			line : lineEnd,
			ch : charEnd
		}, {
			className : markClass,
			readOnly : false
		});
		
		// save mark text in an array which is used to clean mark
		var state = getSyntaxErrorHighlightState(cm);
		state.marked.push(mark);
		
		var tooltipLabel = getTooltipLabel(annotationLabel, false);
		// TODO : add tooltip for mark text. How to manage that???
		// I would like do like this
		/*mark.onmouseover = function() {
			tooltip.show(tooltipLabel, null, severity);
		};
		mark.onmouseout = function() {
			tooltip.hide();
		};*/				
	}

	function markDocument() {
		var gutterID = GUTTER_ID;
		clearMarks(cm, gutterID);

		var collector = new AnnotationsCollector();

		var contents = (options.getContents ? options.getContents() : cm
				.getValue());
		collectAnnotations(contents, collector, cm);

		var linesNumber = collector.linesNumber;
		// Loop for each lines number which contains problems
		for ( var i = 0; i < linesNumber.length; i++) {
			var line = linesNumber[i];
			var annotations = collector.linesAnnotations[line];
			
			// loop for each annotations for the current line to
			// - create a markText for each annotations
			// - create a tooltip with the list of annotations

			var maxSeverity = null;
			var markerTooltipLabel = '';			
			var multiple = annotations.length > 1; 
			
			// create a markText for each annotations
			for ( var j = 0; j < annotations.length; j++) {
				var annotation = annotations[j];
				if (options.formatAnnotation) {
					annotation = options.formatAnnotation(annotation);
				}

				// Create mark text
				
				var severity = annotation.severity;
				var lineStart = annotation.lineStart;
				var charStart = annotation.charStart;
				var lineEnd = annotation.lineEnd;
				var charEnd = annotation.charEnd;
				var description = annotation.description;

				var annotationLabel = getTooltipAnnotationLabel(description, severity);
				makeMarkText(severity, lineStart, charStart, lineEnd, charEnd, annotationLabel);																
				
				markerTooltipLabel+=annotationLabel;				
				maxSeverity = getMaxSeverity(maxSeverity, severity);
			}
			markerTooltipLabel = getTooltipLabel(markerTooltipLabel, multiple);

			
			// create a tooltip with the list of annotations
			var marker = makeMarker(markerTooltipLabel, maxSeverity, multiple);

			var info = cm.lineInfo(line);
			cm.setGutterMarker(line, gutterID, info.gutterMarkers ? null
					: marker);
		}
	}

	return markDocument();
};
