CodeMirror.defineMode("httpmessage", function() {
	return {
		token: function(stream, state) {
			if (state.endOfHeaders) {
				stream.skipToEnd();
				return "body";
			}
			
			if (state.inHeaderValue) {
				// "Header fields can be extended over multiple lines by preceding each extra line with at least one SP or HT."
				// http://www.w3.org/Protocols/rfc2616/rfc2616-sec4.html#sec4.2
				if (!stream.sol() || stream.match(/^[ \t]+/)) {
					stream.skipToEnd();
					// field-value: http://www.w3.org/Protocols/rfc2616/rfc2616-sec4.html#sec4.2
					return "string";
				} else {
					state.inHeaderValue = false;
				}
			}

			var matches = stream.match(/^HTTP\/1.\d (\d+)/, false);
			if (matches) {
				stream.skipToEnd();
				// Status-Line: http://www.w3.org/Protocols/rfc2616/rfc2616-sec6.html#sec6.1
				return "status-" + this._getTypeFromStatus(matches[1]);
			} else if (stream.match(/^.* HTTP\/1.\d$/, false)) {
				stream.skipToEnd();
				// Request-Line: http://www.w3.org/Protocols/rfc2616/rfc2616-sec5.html#sec5.1
				return "request-line";
			} else if (stream.match(/^.*:/, false)) {
				stream.skipTo(":");
				stream.eat(":");
				state.inHeaderValue = true;
				// field-name: http://www.w3.org/Protocols/rfc2616/rfc2616-sec4.html#sec4.2
				return "atom";
			} else {
				// shouldn't get here
				stream.skipToEnd();
				return "error";
			}
		},

		blankLine: function(state) {
			state.endOfHeaders = true;
		},

		_getTypeFromStatus: function(status) {
			if (status >= 200 && status < 300) {
				return "success";
			} else if (status >= 300 && status < 400) {
				return "redirect";
			} else if (status >= 400 && status < 500) {
				return "client-error";
			} else if (status >= 500 && status < 600) {
				return "server-error";
			} else {
				return "unknown";
			}
		},

		startState: function() {
			return {
				endOfHeaders: false,
				inHeaderValue: false,
			};
		}
	};
});

CodeMirror.defineMIME("message/http", "httpmessage");
