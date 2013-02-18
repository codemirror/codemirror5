(function() {

	var localConfig, defaults, defaultIndent, bogus, warnings, errors;

	localConfig = {};

	defaults = [ "undef", "newcap", "smarttabs" ];
	defaultIndent = 3;

	bogus = [ "Dangerous comment" ];

	warnings = [ [ "Expected '{'",
			"Statement body should be inside '{ }' braces." ] ];

	errors = [ "Missing semicolon", "Extra comma", "Missing property name",
			"Unmatched ", " and instead saw", " is not defined",
			"Unclosed string", "Stopping, unable to continue" ];

	CodeMirror.javascriptValidator = function(contents, collector, cm) {
		var positionalAdjustment = 1;
		var result = jshint(contents);
		var errors = result.errors;
		if (errors) {
			parseErrors(errors, positionalAdjustment, collector);
		}
	};

	function jshint(contents) {
		JSHINT(contents/* , localConfig.options, localConfig.options.predef */);
		return JSHINT.data();
	}

	function cleanup(error) {
		// All problems are warnings by default
		fixWith(error, warnings, "warning", true);
		fixWith(error, errors, "error");

		return isBogus(error) ? null : error;
	}

	function fixWith(error, fixes, severity, force) {
		var description, fix, find, replace, found;

		description = error.description;

		for ( var i = 0; i < fixes.length; i++) {
			fix = fixes[i];
			find = (typeof fix === "string" ? fix : fix[0]);
			replace = (typeof fix === "string" ? null : fix[1]);
			found = description.indexOf(find) !== -1;

			if (force || found) {
				error.severity = severity;
			}
			if (found && replace) {
				error.description = replace;
			}
		}
	}

	function isBogus(error) {
		var description = error.description;
		for ( var i = 0; i < bogus.length; i++) {
			if (description.indexOf(bogus[i]) !== -1) {
				return true;
			}
		}
		return false;
	}

	function parseErrors(errors, positionalAdjustment, collector) {
		for ( var i = 0; i < errors.length; i++) {
			error = errors[i];
			if (error) {
				var linetabpositions, index;

				linetabpositions = [];

				// This next block is to fix a problem in jshint. Jshint
				// replaces
				// all tabs with spaces then performs some checks. The error
				// positions (character/space) are then reported incorrectly,
				// not taking the replacement step into account. Here we look
				// at the evidence line and try to adjust the character position
				// to the correct value.
				if (error.evidence) {
					// Tab positions are computed once per line and cached
					var tabpositions = linetabpositions[error.line];
					if (!tabpositions) {
						var evidence = error.evidence;
						tabpositions = [];
						// ugggh phantomjs does not like this
						// forEachChar(evidence, function(item, index) {
						Array.prototype.forEach.call(evidence, function(item,
								index) {
							if (item === '\t') {
								// First col is 1 (not 0) to match error
								// positions
								tabpositions.push(index + 1);
							}
						});
						linetabpositions[error.line] = tabpositions;
					}
					if (tabpositions.length > 0) {
						var pos = error.character;
						tabpositions.forEach(function(tabposition) {
							if (pos > tabposition) {
								pos -= positionalAdjustment;
							}
						});
						error.character = pos;
					}
				}

				var start = error.character - 1, end = start + 1;
				if (error.evidence) {
					index = error.evidence.substring(start).search(/.\b/);
					if (index > -1) {
						end += index;
					}
				}

				// Convert to format expected by validation service
				error.description = error.reason;// + "(jshint)";
				error.start = error.character;
				error.end = end;
				error = cleanup(error);

				if (error) {
					var severity = error.severity;
					var lineStart = error.line - 1;
					var charStart = start;
					var lineEnd = error.line - 1;
					var charEnd = end;
					var description = error.description;
					
					collector.addAnnotation(severity, lineStart, charStart,
							lineEnd, charEnd, description);
					
				}
			}
		}
	}
})();