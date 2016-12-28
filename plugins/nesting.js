Jinkela.cssPreprocessor = function (styleSheet) {
  // remove comments
  styleSheet = styleSheet.replace(/(\/\/.+)|(\/\*[\s\S]*?\*\/)|((['"])(?:\\\4|.)*?\4)/g,
    function ($0, lineComment, blockComment, quotedString) {
      return quotedString || '';
    });
  /*
  TOKEN = ((['"])(?:\\\4|.)*?\4)    # quoted string
        | ({)                       # block start
        | (})                       # block end
        | (;)                       # property end
        | ((@media\b[^{]+)\{)       # media query block start
        | (.)                       # other character
  */
  var tokenize = /((['"])(?:\\\2|.)*?\2)|({)|(})|(;)|((@media\b[^{]+)\{)|(.)/g;
  var gen = [];
  var startPos = 0;
  var selectorStack = [ [ '' ] ];
  var propertyStack = [];
  var properties = [];
  var inMediaQuery = 0;
  for (var match; (match = tokenize.exec(styleSheet)); ) {
    var warn = function (message) {
      var parsed = styleSheet.slice(0, match.index + 1);
      var ch = parsed.match(/.*$/)[0].length;
      var line = parsed.length - parsed.replace(/\n/g, '').length + 1;
      console.warn(message + ' at line ' + line + ', column ' + ch + '\n' + parsed);
    };
    switch (true) {
      // block start
      case match[3] !== void 0:
        propertyStack.push(properties);
        properties = [];
        if (inMediaQuery > 0) inMediaQuery++;
        var outer = selectorStack[selectorStack.length - 1];
        var inner = styleSheet.slice(startPos, match.index).replace(/^\s+|\s+$/g, '').split(/\s*,\s*/g);
        var mixed = [];
        for (var i = 0; i < outer.length; i++) {
          for (var j = 0; j < inner.length; j++) {
            mixed.push((outer[i] + ' ' + inner[j]).replace(/\s+&/g, '').replace(/^\s+|\s+$/g, ''));
          }
        }
        selectorStack.push(mixed);
        startPos = match.index + 1;
        break;
      // block end
      case match[4] !== void 0:
        if (selectorStack.length === 1) {
          warn('unexpected block end');
          return styleSheet;
        }
        properties.push(styleSheet.slice(startPos, match.index));
        var selector = selectorStack.pop();
        if (inMediaQuery > 0 && --inMediaQuery === 0) {
          gen.push('}', '\n');
        } else {
          gen.push(selector.join(', '), '{', properties.join('\n'), '}', '\n');
        }
        properties = propertyStack.pop();
        startPos = match.index + 1;
        break;
      // property end
      case match[5] !== void 0:
        properties.push(styleSheet.slice(startPos, match.index + 1));
        startPos = match.index + 1;
        break;
      // media query block start
      case match[6] !== void 0:
        if (selectorStack.length > 1) {
          warn('unexpected media query');
          return styleSheet;
        }
        propertyStack.push(properties);
        properties = [];
        inMediaQuery++;
        gen.push(match[9], '{', '\n');
        selectorStack.push([ '' ]);
        startPos = match.index + 1;
        break;
    }
  }
  return gen.join('');
};
