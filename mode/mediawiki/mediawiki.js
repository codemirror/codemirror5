/* global CodeMirror */
(function( mod ) { mod( CodeMirror ); })(function( CodeMirror ) {
'use strict';

function eatMnemonic( stream, style, mnemonicStyle ) {
	var ok;
	if ( stream.eat( '#' ) ) {
		if (stream.eat( 'x' ) ) {
			ok = stream.eatWhile( /[a-fA-F\d]/ ) && stream.eat( ';');
		} else {
			ok = stream.eatWhile( /[\d]/ ) && stream.eat( ';' );
		}
	} else {
		ok = stream.eatWhile( /[\w\.\-:]/ ) && stream.eat( ';' );
	}
	if ( ok ) {
		mnemonicStyle += ' mw-mnemonic';
		return mnemonicStyle;
	}
	return style;
}

CodeMirror.defineMode( 'mediawiki', function( config/*, parserConfig */ ) {

	var urlProtocols = new RegExp( config.mwextUrlProtocols, 'i' );
	var permittedHtmlTags = {'b': true, 'bdi': true, 'del': true, 'i': true, 'ins': true,
		'u': true, 'font': true, 'big': true, 'small': true, 'sub': true, 'sup': true,
		'h1': true, 'h2': true, 'h3': true, 'h4': true, 'h5': true, 'h6': true, 'cite': true,
		'code': true, 'em': true, 's': true, 'strike': true, 'strong': true, 'tt': true,
		'var': true, 'div': true, 'center': true, 'blockquote': true, 'ol': true, 'ul': true,
		'dl': true, 'table': true, 'caption': true, 'pre': true, 'ruby': true, 'rb': true,
		'rp': true, 'rt': true, 'rtc': true, 'p': true, 'span': true, 'abbr': true, 'dfn': true,
		'kbd': true, 'samp': true, 'data': true, 'time': true, 'mark': true, 'br': true,
		'wbr': true, 'hr': true, 'li': true, 'dt': true, 'dd': true, 'td': true, 'th': true,
		'tr': true,	'noinclude': true, 'includeonly': true, 'onlyinclude': true};

	function makeStyle( style, state, endGround ) {
		if ( state.isBold ) {
			style += ' strong';
		}
		if ( state.isItalic ) {
			style += ' em';
		}
		return makeLocalStyle( style, state, endGround );
	}

	function makeLocalStyle( style, state, endGround ) {
		var ground = '';
		switch ( state.nTemplate ) {
			case 0:
				break;
			case 1:
				ground += '-template';
				break;
			case 2:
				ground += '-template2';
				break;
			default:
				ground += '-template3';
				break;
		}
		switch ( state.nExt ) {
			case 0:
				break;
			case 1:
				ground += '-ext';
				break;
			case 2:
				ground += '-ext2';
				break;
			default:
				ground += '-ext3';
				break;
		}
		if ( state.nLink > 0 ) {
			ground += '-link';
		}
		if ( ground !== '' ) {
			style = 'mw' + ground + '-ground ' + style;
		}
		if ( endGround ) {
			state[endGround]--;
		}
		return style;
	}

	function eatBlock( style, terminator ) {
		return function( stream, state ) {
			while ( !stream.eol() ) {
				if ( stream.match( terminator ) ) {
					state.tokenize = state.stack.pop();
					break;
				}
				stream.next();
			}
			return makeLocalStyle( style, state );
		};
	}

	function eatEnd( style ) {
		return function( stream, state ) {
			stream.skipToEnd();
			state.tokenize = state.stack.pop();
			return makeLocalStyle( style, state );
		};
	}

	function eatChar( char, style ) {
		return function( stream, state ) {
			state.tokenize = state.stack.pop();
			if ( stream.eat( char ) ) {
				return makeLocalStyle( style, state );
			}
			return makeLocalStyle( 'error', state );
		};
	}

	function eatSectionHeader( count ) {
		return function( stream, state ) {
			if ( stream.match( /[^&<\[\{~]+/ ) ) {
				if ( stream.eol() ) {
					stream.backUp( count );
					state.tokenize = eatEnd( 'mw-section-header' );
				}
				return null; // style is null
			}
			return eatWikiText( '', '' )( stream, state );
		};
	}

	function inVariable( stream, state ) {
		if ( stream.match( /[^\{\}\|]+/ ) ) {
			return makeLocalStyle( 'mw-templatevariable-name', state );
		}
		if ( stream.eat( '|' ) ) {
			state.tokenize = inVariableDefault;
			return makeLocalStyle( 'mw-templatevariable-delimiter', state );
		}
		if ( stream.match( '}}}' ) ) {
			state.tokenize = state.stack.pop();
			return makeLocalStyle( 'mw-templatevariable-bracket', state );
		}
		if ( stream.match( '{{{' ) ) {
			state.stack.push( state.tokenize );
			return makeLocalStyle( 'mw-templatevariable-bracket', state );
		}
		stream.next();
		return makeLocalStyle( 'mw-templatevariable-name', state );
	}

	function inVariableDefault( stream, state ) {
		if ( stream.match( /[^\{\}\[<\&~]+/ ) ) {
			return makeLocalStyle( 'mw-templatevariable', state );
		}
		if ( stream.match( '}}}' ) ) {
			state.tokenize = state.stack.pop();
			return makeLocalStyle( 'mw-templatevariable-bracket', state );
		}
		return eatWikiText( 'mw-templatevariable', '' )( stream, state );
	}

	function inParserFunctionName( stream, state ) {
		if ( stream.match( /#?[^\:\}\{~]+/ ) ) { // FIXME: {{#name}} and {{uc}} are wrong, must have ':'
			return makeLocalStyle( 'mw-parserfunction-name', state );
		}
		if ( stream.eat( ':' ) ) {
			state.tokenize = inParserFunctionArguments;
			return makeLocalStyle( 'mw-parserfunction-delimiter', state );
		}
		if ( stream.match( '}}' ) ) {
			state.tokenize = state.stack.pop();
			return makeLocalStyle( 'mw-parserfunction-bracket', state, 'nExt' );
		}
		return eatWikiText( 'mw-parserfunction', '' )( stream, state );
	}

	function inParserFunctionArguments( stream, state ) {
		if ( stream.match( /[^\|\}\{\[<\&~]+/ ) ) {
			return makeLocalStyle( 'mw-parserfunction', state );
		} else if ( stream.eat( '|' ) ) {
			return makeLocalStyle( 'mw-parserfunction-delimiter', state );
		} else if ( stream.match( '}}' ) ) {
			state.tokenize = state.stack.pop();
			return makeLocalStyle( 'mw-parserfunction-bracket', state, 'nExt' );
		}
		return eatWikiText( 'mw-parserfunction', '' )( stream, state );
	}

	function eatTemplatePageName( haveAte ) {
		return function( stream, state ) {
			if ( stream.match( /[\s\u00a0]*\|[\s\u00a0]*/ ) ) {
				state.tokenize = eatTemplateArgument( true );
				return makeLocalStyle( 'mw-template-delimiter', state );
			}
			if ( stream.match( /[\s\u00a0]*\}\}/ ) ) {
				state.tokenize = state.stack.pop();
				return makeLocalStyle( 'mw-template-bracket', state, 'nTemplate' );
			}
			if ( haveAte && stream.sol() ) {
				// @todo error message
				state.nTemplate--;
				state.tokenize = state.stack.pop();
				return;
			}
			if ( stream.match( /[\s\u00a0]*[^\s\u00a0\|\}<\{\&~]+/ ) ) {
				state.tokenize = eatTemplatePageName( true );
				return makeLocalStyle( 'mw-template-name mw-pagename', state );
			} else if ( stream.eatSpace() ) {
				if ( stream.eol() === true ) {
					return makeLocalStyle( 'mw-template-name', state );
				}
				return makeLocalStyle( 'mw-template-name mw-pagename', state );
			}
			return eatWikiText( 'mw-template-name mw-pagename', 'mw-template-name-mnemonic mw-pagename' )( stream, state );
		};
	}

	function eatTemplateArgument( expectArgName ) {
		return function( stream, state ) {
			if ( expectArgName && stream.eatWhile( /[^=\|\}\{\[<\&~]/ ) ) {
				if ( stream.eat( '=' ) ) {
					state.tokenize = eatTemplateArgument( false );
					return makeLocalStyle( 'mw-template-argument-name', state );
				}
				return makeLocalStyle( 'mw-template', state );
			} else if ( stream.eatWhile( /[^\|\}\{\[<\&~]/ ) ) {
				return makeLocalStyle( 'mw-template', state );
			} else if ( stream.eat( '|' ) ) {
				state.tokenize = eatTemplateArgument( true );
				return makeLocalStyle( 'mw-template-delimiter', state );
			} else if ( stream.match( '}}' ) ) {
				state.tokenize = state.stack.pop();
				return makeLocalStyle( 'mw-template-bracket', state, 'nTemplate' );
			}
			return eatWikiText( 'mw-template', '' )( stream, state );
		};
	}

	function eatExternalLinkProtocol( chars ) {
		return function( stream, state ) {
			while ( chars > 0 ) {
				chars--;
				stream.next();
			}
			if ( stream.eol() ) {
				state.nLink--;
				// @todo error message
				state.tokenize = state.stack.pop();
			} else {
				state.tokenize = inExternalLink;
			}
			return makeLocalStyle( 'mw-extlink-protocol', state );
		};
	}

	function inExternalLink( stream, state ) {
		if ( stream.sol() ) {
			state.nLink--;
			// @todo error message
			state.tokenize = state.stack.pop();
			return;
		}
		if ( stream.match( /[\s\u00a0]*\]/ ) ) {
			state.tokenize = state.stack.pop();
			return makeLocalStyle( 'mw-extlink-bracket', state, 'nLink' );
		}
		if ( stream.eatSpace() ) {
			state.tokenize = inExternalLinkText;
			return makeStyle( '', state );
		}
		if ( stream.match( /[^\s\u00a0\]\{\&~]+/ ) || stream.eatSpace() ) {
			return makeStyle( 'mw-extlink', state );
		}
		return eatWikiText( 'mw-extlink', '' )( stream, state );
	}

	function inExternalLinkText( stream, state ) {
		if ( stream.sol() ) {
			state.nLink--;
			// @todo error message
			state.tokenize = state.stack.pop();
			return;
		}
		if ( stream.eat( ']' ) ) {
			state.tokenize = state.stack.pop();
			return makeLocalStyle( 'mw-extlink-bracket', state, 'nLink' );
		}
		if ( stream.match( /[^'\]\{\&~]+/ ) ) {
			return makeStyle( 'mw-extlink-text', state );
		}
		return eatWikiText( 'mw-extlink-text', '' )( stream, state );
	}

	function inLink( stream, state ) {
		if ( stream.sol() ) {
			state.nLink--;
			// @todo error message
			state.tokenize = state.stack.pop();
			return;
		}
		if ( stream.match( /[\s\u00a0]*#[\s\u00a0]*/ ) ) {
			state.tokenize = inLinkToSection;
			return makeLocalStyle( 'mw-link', state );
		}
		if ( stream.match( /[\s\u00a0]*\|[\s\u00a0]*/ ) ) {
			state.tokenize = eatLinkText();
			return makeLocalStyle( 'mw-link-delimiter', state );
		}
		if ( stream.match( /[\s\u00a0]*\]\]/ ) ) {
			state.tokenize = state.stack.pop();
			return makeLocalStyle( 'mw-link-bracket', state, 'nLink' );
//					if ( !stream.eatSpace() ) {
//						state.ImInBlock.push( 'LinkTrail' );
//					}
		}
		if ( stream.match( /[\s\u00a0]*[^\s\u00a0#\|\]\&~\{]+/ ) || stream.eatSpace() ) { //FIXME '{{' brokes Link, sample [[z{{page]]
			return makeStyle( 'mw-link-pagename mw-pagename', state );
		}
		return eatWikiText( 'mw-link-pagename mw-pagename', 'mw-pagename' )( stream, state );
	}

	function inLinkToSection( stream, state ) {
		if ( stream.sol() ) {
			// @todo error message
			state.nLink--;
			state.tokenize = state.stack.pop();
			return;
		}
		if ( stream.match( /[^\|\]\&~\{\}]+/ ) ) { //FIXME '{{' brokes Link, sample [[z{{page]]
			return makeLocalStyle( 'mw-link-tosection', state );
		}
		if ( stream.eat( '|' ) ) {
			state.tokenize = eatLinkText();
			return makeLocalStyle( 'mw-link-delimiter', state );
		}
		if ( stream.match( ']]' ) ) {
			state.tokenize = state.stack.pop();
			return makeLocalStyle( 'mw-link-bracket', state, 'nLink' );
//					if ( !stream.eatSpace() ) {
//						state.ImInBlock.push( 'LinkTrail' );
//					}
		}
		return eatWikiText( 'mw-link-tosection', '' )( stream, state );
	}

	function eatLinkText() {
		var isBold, isItalic;
		return function ( stream, state ) {
			if ( stream.match( ']]' ) ) {
				state.tokenize = state.stack.pop();
				return makeLocalStyle( 'mw-link-bracket', state, 'nLink' );
			}
			if ( stream.match( '\'\'\'' ) ) {
				isBold = (isBold ? false : true);
				return makeLocalStyle( 'mw-link-text mw-apostrophes', state );
			}
			if ( stream.match( '\'\'' ) ) {
				isItalic = (isItalic ? false : true);
				return makeLocalStyle( 'mw-link-text mw-apostrophes', state );
			}
			var tmpstyle = 'mw-link-text';
			if ( isBold ) {
				tmpstyle += ' strong';
			}
			if ( isItalic ) {
				tmpstyle += ' em';
			}
			if ( stream.match( /[^'\]\{\&~]+/ ) ) {
				return makeStyle( tmpstyle, state );
			}
			return eatWikiText( tmpstyle, '' )( stream, state );
		};
	}

	function eatTagName( chars, isCloseTag, isHtmlTag ) {
		return function  ( stream, state ) {
			var name = '';
			while ( chars > 0 ) {
				chars--;
				name = name + stream.next();
			}
			if ( stream.eol() ) {
				// @todo error message
				state.tokenize = state.stack.pop();
				return makeLocalStyle( (isHtmlTag ? 'mw-htmltag-name' : 'mw-exttag-name'), state );
			}
			stream.eatSpace();
			if ( stream.eol() ) {
				// @todo error message
				state.tokenize = state.stack.pop();
				return makeLocalStyle( (isHtmlTag ? 'mw-htmltag-name' : 'mw-exttag-name'), state );
			}

			if ( isHtmlTag ) {
				if ( isCloseTag ) {
					state.tokenize = eatChar( '>', 'mw-htmltag-bracket' );
				} else {
					state.tokenize = eatHtmlTagAttribute( name );
				}
				return makeLocalStyle( 'mw-htmltag-name', state );
			} // it is the extension tag
			if ( isCloseTag ) {
				state.tokenize = eatChar( '>', 'mw-exttag-bracket' );
			} else {
				state.tokenize = eatExtTagAttribute( name );
			}
			return makeLocalStyle( 'mw-exttag-name', state );
		};
	}

	function eatHtmlTagAttribute( name ) {
		return function ( stream, state ) {
			if ( stream.match( /[^>\/<\{\&~]+/ ) ) {
				return makeLocalStyle( 'mw-htmltag-attribute', state );
			}
			if ( stream.eat( '>' ) ) {
				state.InHtmlTag.push( name );
				state.tokenize = state.stack.pop();
				return makeLocalStyle( 'mw-htmltag-bracket', state );
			}
			if ( stream.match( '/>') ) {
				state.tokenize = state.stack.pop();
				return makeLocalStyle( 'mw-htmltag-bracket', state );
			}
			return eatWikiText( 'mw-htmltag-attribute', '' )( stream, state );
		};
	}

	function eatExtTagAttribute( name ) {
		return function ( stream, state ) {
			if ( stream.match( /[^>\/<\{\&~]+/ ) ) {
				return makeLocalStyle( 'mw-exttag-attribute', state );
			}
			if ( stream.eat( '>' ) ) {
				state.extName = name;
				if ( config.mwextMode && name in config.mwextMode.tag  ) {
					state.extMode = CodeMirror.getMode( config, config.mwextMode.tag[name] );
					state.extState = CodeMirror.startState( state.extMode );
				}
				state.tokenize = eatExtTagArea( name );
				return makeLocalStyle( 'mw-exttag-bracket', state );
			}
			if ( stream.match( '/>') ) {
				state.tokenize = state.stack.pop();
				return makeLocalStyle( 'mw-exttag-bracket', state );
			}
			return eatWikiText( 'mw-exttag-attribute', '' )( stream, state );
		};
	}

	function eatExtTagArea( name ) {
		return function( stream, state ) {
			var origString = false, from = stream.pos, to;
			var pattern = new RegExp( '</' + name + '\\s*>' );
			var m = pattern.exec( from ? stream.string.slice( from ) : stream.string );
			if ( m ) {
				if ( m.index === 0 ) {
					state.tokenize = eatExtCloseTag( name );
					state.extName = false;
					if ( state.extMode !== false ) {
						state.extMode = false;
						state.extState = false;
					}
					return state.tokenize( stream, state );
				}
				to = m.index + from;
				origString = stream.string;
				stream.string = origString.slice( 0, to );
			}
			state.stack.push( state.tokenize );
			state.tokenize = eatExtTokens( origString );
			return state.tokenize( stream, state );
		};
	}

	function eatExtCloseTag( name ) {
		return function ( stream, state ) {
			stream.next(); // eat <
			stream.next(); // eat /
			state.tokenize = eatTagName( name.length, true, false );
			return makeLocalStyle( 'mw-exttag-bracket', state );
		};
	}

	function eatExtTokens( origString ) {
		return function ( stream, state ) {
			var ret;
			if ( state.extMode === false ) {
				ret = (origString === false && stream.sol() ? 'line-cm-mw-exttag' : 'mw-exttag');
				stream.skipToEnd();
			} else {
				ret = (origString === false && stream.sol() ? 'line-cm-mw-tag-' : 'mw-tag-') + state.extName;
				ret += ' ' + state.extMode.token( stream, state.extState, origString === false );
			}
			if ( stream.eol() ) {
				if ( origString !== false ) {
					stream.string = origString;
				}
				state.tokenize = state.stack.pop();
			}
			return makeLocalStyle( ret, state );
		};
	}

	function inTableDefinition( stream, state ) {
		if ( stream.sol() ) {
			state.tokenize = inTable;
			return inTable( stream, state );
		}
		return eatWikiText( 'mw-table-definition', '' )( stream, state );
	}

	function inTable( stream, state ) {
		if ( stream.sol() ) {
			if ( stream.eat( '|' ) ) {
				if ( stream.eat( '-' ) ) {
					stream.eatSpace();
					state.tokenize = inTableDefinition;
					return makeLocalStyle( 'mw-table-delimiter', state );
				}
				if ( stream.eat( '}' ) ) {
					state.tokenize = state.stack.pop();
					return makeLocalStyle( 'mw-table-bracket', state );
				}
				stream.eatSpace();
				state.tokenize = eatTableRow( true, false );
				return makeLocalStyle( 'mw-table-delimiter', state );
			}
			if ( stream.eat( '!' ) ) {
				stream.eatSpace();
				state.tokenize = eatTableRow( true, true );
				return makeLocalStyle( 'mw-table-delimiter', state );
			}
		}
		return eatWikiText( '', '' )( stream, state );
	}

	function eatTableRow( isStart, isHead ) {
		return function ( stream, state ) {
			if ( stream.sol() ) {
				var peek = stream.peek();
				if ( peek === '|' || peek === '!' ) {
					state.tokenize = inTable;
					return state.tokenize( stream, state );
				}
				state.isBold = false;
				state.isItalic = false;
			} else {
				if ( stream.match( /[^'\|\{\[<\&~]+/ ) ) {
					return makeStyle( (isHead ? 'strong' : ''), state );
				}
				if ( stream.match( '||' ) || isHead && stream.match( '!!' ) || (isStart && stream.eat( '|' )) ) {
					state.isBold = false;
					state.isItalic = false;
					if ( isStart ) {
						state.tokenize = eatTableRow( false, isHead );
					}
					return makeLocalStyle( 'mw-table-delimiter', state );
				}
			}
			return eatWikiText( (isHead ? 'strong' : ''), (isHead ? 'strong' : '') )( stream, state );
		};
	}

	function eatWikiText( style, mnemonicStyle ) {
		return function( stream, state ) {
			function chain( parser ) {
				state.stack.push( state.tokenize );
				state.tokenize = parser;
				return parser( stream, state );
			}
			var sol = stream.sol();
			var ch = stream.next();

			if ( sol ) {
				state.isBold = false;
				state.isItalic = false;
				switch ( ch ) {
					case ' ':
						return 'mw-skipformatting';
					case '-':
						if ( stream.match( '---' ) ) {
							return 'mw-hr';
						}
						break;
					case '=':
						var tmp = stream.match( /(={0,5})(.+?(=\1\s*))$/ );
						if ( tmp ) { // Title
							stream.backUp( tmp[2].length );
							state.stack.push( state.tokenize );
							state.tokenize = eatSectionHeader( tmp[3].length );
							return 'mw-section-header line-cm-mw-section-' + ( tmp[1].length + 1 );
						}
						break;
					case '*':
					case '#':
						if ( stream.match( /[\*#]*:*/ ) ) {
							return 'mw-list';
						}
						break;
					case ':':
						if ( stream.match( /:*[\*#]*/ ) ) {
							return 'mw-indenting';
						}
						break;
					case '{':
						if ( stream.eat( '|' ) ) {
							stream.eatSpace();
							state.stack.push( state.tokenize );
							state.tokenize = inTableDefinition;
							return 'mw-table-bracket';
						}
				}
			}

			switch ( ch ) {
				case '&':
					return makeStyle( eatMnemonic( stream, style, mnemonicStyle ), state );
				case '\'':
					if ( stream.match( '\'\'' ) ) {
						state.isBold = state.isBold ? false : true;
						return makeLocalStyle( 'mw-apostrophes', state );
					} else if ( stream.eat( '\'' ) ) {
						state.isItalic = state.isItalic ? false : true;
						return makeLocalStyle( 'mw-apostrophes', state );
					}
					break;
				case '[':
					if ( stream.eat( '[' ) ) { // Link Example: [[ Foo | Bar ]]
						stream.eatSpace();
						if ( /[^\]\|\[]/.test( stream.peek() ) ) {
							state.nLink++;
							state.stack.push( state.tokenize );
							state.tokenize = inLink;
							return makeLocalStyle( 'mw-link-bracket', state );
						}
					} else {
						var mt = stream.match( urlProtocols );
						if ( mt ) {
							state.nLink++;
							stream.backUp( mt[0].length );
							state.stack.push( state.tokenize );
							state.tokenize = eatExternalLinkProtocol( mt[0].length );
							return makeLocalStyle( 'mw-extlink-bracket', state );
						}
					}
					break;
				case '{':
					if ( stream.match( '{{' ) ) { // Variable
						stream.eatSpace();
						state.stack.push( state.tokenize );
						state.tokenize = inVariable;
						return makeLocalStyle( 'mw-templatevariable-bracket', state );
					} else if ( stream.match( /\{[\s\u00a0]*/ ) ) {
						if ( stream.peek() === '#' ) { // Parser function
							state.nExt++;
							state.stack.push( state.tokenize );
							state.tokenize = inParserFunctionName;
							return makeLocalStyle( 'mw-parserfunction-bracket', state );
						}
						// Check for parser function without '#'
						var name = stream.match( /([^\s\u00a0\}\[\]<\{\'\|\&\:]+)(\:|[\s\u00a0]*)(\}\}?)?(.)?/ );
						if ( name ) {
							stream.backUp( name[0].length );
							if ( (name[2] === ':' || name[4] === undefined || name[3] === '}}') && config.mwextFunctionSynonyms && (name[1].toLowerCase() in config.mwextFunctionSynonyms[0] || name[1] in config.mwextFunctionSynonyms[1]) ) {
								state.nExt++;
								state.stack.push( state.tokenize );
								state.tokenize = inParserFunctionName;
								return makeLocalStyle( 'mw-parserfunction-bracket', state );
							}
						}
						// Template
						state.nTemplate++;
						state.stack.push( state.tokenize );
						state.tokenize = eatTemplatePageName( false );
						return makeLocalStyle( 'mw-template-bracket', state );
					}
					break;
				case '<':
					if ( stream.match( '!--' ) ) { // coment
						return chain( eatBlock( 'mw-comment', '-->' ) );
					}
					var isCloseTag = ( stream.eat( '/' ) ? true : false );
					var tagname = stream.match( /[^>\/\s\u00a0\.\*\,\[\]\{\}\$\^\+\?\|\/\\'`~<=!@#%&\(\)-]+/ );
					if ( tagname ) {
						tagname = tagname[0].toLowerCase();
						if ( config.mwextTags && tagname in config.mwextTags ) { // Parser function
							if ( isCloseTag === true ) {
								// @todo message
								return 'error';
							}
							stream.backUp( tagname.length );
							state.stack.push( state.tokenize );
							state.tokenize = eatTagName( tagname.length, isCloseTag, false );
							return makeLocalStyle( 'mw-exttag-bracket', state );
						}
						if ( tagname in permittedHtmlTags ) { // Html tag
							if ( isCloseTag === true && tagname !== state.InHtmlTag.pop() ) {
								// @todo message
								return 'error';
							}
							stream.backUp( tagname.length );
							state.stack.push( state.tokenize );
							state.tokenize = eatTagName( tagname.length, isCloseTag, true );
							return makeLocalStyle( 'mw-htmltag-bracket', state );
						}
						stream.backUp( tagname.length );
					}
					break;
				case '~':
					if ( stream.match( /~{2,4}/ ) ) {
						return 'mw-signature';
					}
					break;
			}
			stream.match( /[^\s\u00a0_>\}\[\]<\{\'\|\&\:~]+/ );
			var ret = makeStyle( style, state );
			return ret;
		};
	}

	return {
		startState: function() {
			return { tokenize: eatWikiText('', ''), stack: [], InHtmlTag:[], isBold: false, isItalic: false, extName: false, extMode: false, extState: false, nTemplate: 0, nLink: 0, nExt: 0 };
		},
		copyState: function( state ) {
			return {
				tokenize: state.tokenize,
				stack: state.stack.concat( [] ),
				InHtmlTag: state.InHtmlTag.concat( [] ),
				isBold: state.isBold,
				isItalic: state.isItalic,
				extName: state.extName,
				extMode: state.extMode,
				extState: state.extMode !== false && CodeMirror.copyState( state.extMode, state.extState ),
				nTemplate: state.nTemplate,
				nLink: state.nLink,
				nExt: state.nExt
			};
		},
		token: function( stream, state ) {
			return state.tokenize( stream, state );
		},
		blankLine: function( state ) {
			if ( state.extName ) {
				if ( state.extMode ) {
					var ret = '';
					if ( state.extMode.blankLine ) {
						ret = ' ' + state.extMode.blankLine( state.extState );
					}
					return 'line-cm-mw-tag-' + state.extName + ret;
				}
				return 'line-cm-mw-exttag';
			}
		}
	};
});

CodeMirror.defineMIME( 'text/mediawiki', 'mediawiki' );

function eatNowiki( style, lineStyle ) {
	return function( stream , state, ownLine ) {
		if ( ownLine && stream.sol() ) {
			state.ownLine = true;
		} else if( ownLine === false && state.ownLine ) {
			state.ownLine = false;
		}
		var s = ( state.ownLine ? lineStyle : style );
		if ( stream.match( /[^&]+/ ) ) {
			return s;
		}
		stream.next(); // eat &
		return eatMnemonic( stream, s, s );
	};
}

CodeMirror.defineMode( 'mw-tag-pre', function( /*config, parserConfig */ ) {
	return {
		startState: function() { return {}; },
		token: eatNowiki( 'mw-tag-pre', 'line-cm-mw-tag-pre' )
	};
});

CodeMirror.defineMode( 'mw-tag-nowiki', function( /*config, parserConfig */ ) {
	return {
		startState: function() { return {}; },
		token: eatNowiki( 'mw-tag-nowiki', 'line-cm-mw-tag-nowiki' )
	};
});

});
