/**/ void function(scope) {
/**/
/**/   // CommonJS
/**/   if (typeof module === 'object' && !!module.exports) return scope(function(name, dependencies, factory) {
/**/     if (typeof name !== 'string') factory = dependencies, dependencies = name, name = null;
/**/     if (!(dependencies instanceof Array)) factory = dependencies, dependencies = [];
/**/     var args;
/**/     args = [  ];
/**/     module.exports = factory.apply(module.exports, args) || module.exports;
/**/   });
/**/
/**/   // AMD, wrap a 'String' to avoid warn of fucking webpack
/**/   if (String(typeof define) === 'function' && !!define.amd) return scope(define);
/**/
/**/   // Global
/**/   scope(function(name, dependencies, factory) {
/**/     if (typeof name !== 'string') factory = dependencies, dependencies = name, name = null;
/**/     if (!(dependencies instanceof Array)) factory = dependencies, dependencies = [];
/**/     var exports = {};
/**/     var args = [];
/**/     for (var i = 0; i < dependencies.length; i++) args[i] = window[dependencies[i]];
/**/     exports = factory.apply(exports, args) || exports;
/**/     if (name) {
/**/       /**/ try { /* Fuck IE8- */
/**/       /**/   if (typeof execScript === 'object') execScript('var ' + name);
/**/       /**/ } catch(error) {}
/**/       window[name] = exports;
/**/     }
/**/   });
/**/
/**/ }(function(define) {

define(function() {
/**/ 'use strict';
/**/ void function() { /**/

var STRICT_TAG = { td: 'tr', 'th': 'tr', tr: 'tbody', tbody: 'table', thead: 'table', tfoot: 'table', caption: 'table' };
var NODE_TYPE_NAME = { 2: 'value', 3: 'data' };
var increment = 1;

// Util Definitions
var getShadedProps = function(that, propName, mapping) {
  var list = [];
  for (var i = that; i; i = Object.getPrototypeOf(i)) {
    var desc = Object.getOwnPropertyDescriptor(i, propName);
    if (desc) list.push(desc.get ? desc.get.call(that) : desc.value);
  }
  list.reverse();
  if (typeof mapping === 'function') for (var j = 0; j < list.length; j++) list[j] = mapping(list[j]);
  return list;
};
var define = function(base, name, desc) {
  return Object.defineProperty(base, name, Object.create(desc, { configurable: { value: true } }));
};
var getOnce = function(base, name, getter) {
  define(base, name, { get: function() { return define(this, name, { value: getter.call(this) })[name]; } });
};

// Walk the template tree
var parseTemplate = function(that, params) {

  var watches = define(that, '@@watches', { value: Object.create(null) })['@@watches'];
  define(that, '@@beforeInit', { value: [] });
  define(that, '@@element', { writable: true, value: [ that.element ] });

  void function callee(node) {

    var i, j, n, key;
    if (node.nodeType === 1) for (i = node.firstChild; i; i = i.nextSibling) callee(i);

    // Init element binding
    var current = [ node ];
    define(node, '@@binding', {
      get: function() { return current; },
      set: function(list) {
        var i;
        list = [].concat(list);
        if (list.length === 0) list.push(document.createComment(' empty binding list '));
        var first = current[0];
        if (that.element === node) that['@@element'] = list;
        if (first.parentNode) for (i = 0; i < list.length; i++) first.parentNode.insertBefore(list[i], first);
        for (i = 0; i < current.length; i++) {
          if (current[i].parentNode && !~list.indexOf(current[i])) current[i].parentNode.removeChild(current[i]);
        }
        current = list;
      }
    });

    // Init nodeList
    var nodeList = [ node ];
    if (node.attributes) nodeList.push.apply(nodeList, node.attributes);

    // Watch all expressions for nodeList
    for (j = 0; (n = nodeList[j]); j++) {
      if (n.nodeType in NODE_TYPE_NAME) {
        define(n, '@@subscribers', { value: [] });
        key = /^\{([$_a-zA-Z][$\w]*)\}$|$/g.exec(n[NODE_TYPE_NAME[n.nodeType]])[1];
        if (key) (key in watches ? watches[key] : watches[key] = []).push(n);
      }
    }

    // Apply directives for nodeList
    for (i = 0; i < directiveList.length; i++) {
      for (j = 0; (n = nodeList[j]); j++) {
        if (directiveList[i].pattern.test(n.nodeName)) directiveList[i].handler(that, n, node);
      }
    }

  }(that.element);

  // Register all watchers
  for (var name in watches) void function(name) {
    var list = watches[name];
    var cache = that[name];
    var desc, handler;
    for (var i = that; i && !desc; i = Object.getPrototypeOf(i)) desc = Object.getOwnPropertyDescriptor(i, name);
    define(that, name, {
      enumerable: true,
      get: function() { return cache; },
      set: function(value) {
        cache = value;
        if (handler) handler(value);
        for (var i = 0; i < list.length; i++) {
          list[i][NODE_TYPE_NAME[list[i].nodeType]] = typeof value === 'function' ? value.name : value;
          'jinkelaValue' in list[i]
            ? (list[i].jinkelaValue = value)
            : define(list[i], 'jinkelaValue', { value: value, writable: true });
          var subscribers = list[i]['@@subscribers'];
          if (subscribers) for (var j = 0; j < subscribers.length; j++) subscribers[j](list[i]);
        }
      }
    });
    if (!(name in params)) that[name] = cache; 
    if (desc && desc.set) handler = desc.set.bind(that);
  }(name);

};

// Extend special fields to instance before parse
var specialFields = [ 'tagName', 'template', 'styleSheet' ];
var extendSpecialFields = function(that, params) {
  for (var key, i = 0; (key = specialFields[i]); i++) {
    if (key in params) {
      define(that, key, { value: params[key] });
      delete params[key];
    }
  }
};

// Main Constructor
var Jinkela = function() {
  var params = {};
  var i, j;
  for (i = 0; i < arguments.length; i++) {
    if (arguments[i] instanceof Object) for (j in arguments[i]) params[j] = arguments[i][j];
  }
  if (typeof this.beforeParse === 'function') this.beforeParse(params); // Expirimental
  extendSpecialFields(this, params);
  parseTemplate(this, params);
  for (var name in params) this[name] = params[name]; // Extends
  for(i = 0; i < this['@@beforeInit'].length; i++) this['@@beforeInit'][i](); // Exec all beforeInit handlers
  // Find all "init" method list in prototype chain and call them
  var args = [ this, arguments ];
  getShadedProps(this, 'init', function(init) { init.apply.apply(init, args); });
};

// Prototype Properties
getOnce(Jinkela.prototype, 'element', function() {
  var target = this.constructor;
  var key = '@@domCache';
  if (!target.hasOwnProperty(key)) {
    var element;
    var template = this.template; // Call once getter handler
    if (template) {
      // Get first tagName from template
      var tagName = String(template.replace(/<!--[\s\S]*?-->/g, '').match(/<([a-z][\w-]*)|$/i)[1]).toLowerCase();
      // Build template
      element = document.createElement(STRICT_TAG[tagName] || 'div');
      element.innerHTML = template;
      if (element.children.length !== 1) throw new Error('Jinkela: Template require 1 root element');
      element = element.firstElementChild;
    } else {
      element = document.createElement(this.tagName || 'div');
    }
    // Find all shaded "styleSheet" from prototype chain and build
    var styleSheetList = getShadedProps(this, 'styleSheet');
    if (styleSheetList.length) {
      var classId = target.name + '-' + increment++;
      element.setAttribute('jinkela-class', classId);
      var styleSheet = styleSheetList.join('\n').replace(/:scope\b/g, '[jinkela-class="' + classId + '"]');
      if (typeof Jinkela.cssPreprocessor === 'function') styleSheet = Jinkela.cssPreprocessor(styleSheet);
      Jinkela.style.insertAdjacentHTML('beforeend', styleSheet);
    }
    define(target, key, { value: element });
  }
  return target[key].cloneNode(true);
});
getOnce(Jinkela, 'style', function() { return document.head.appendChild(document.createElement('style')); });

var createRender = function(name, handler) {
  define(Jinkela.prototype, name, {
    value: function(target) {
      if (target instanceof Jinkela) target = target.element;
      var first = target.firstElementChild;
      for (var i = 0; i < this['@@element'].length; i++) handler.call(this, target, this['@@element'][i], first);
      return this;
    }
  });
};
createRender('to', function(target, base) { target.appendChild(base); });
createRender('prependTo', function(target, base, offset) { target.insertBefore(base, offset); });
createRender('renderWith', function(target, base) { target.parentNode.replaceChild(base, target); });

// Directive register
var directiveList = [];
Jinkela.register = function(options) {
  directiveList.push(options);
  directiveList.sort(function(a, b) { return a.priority - b.priority; });
};

// Export to global
window.Jinkela = Jinkela;

/**/ }(); /**/
/**/ 'use strict';
/**/ void function() { /**/

  var increment = 1;

  Jinkela.html = function() {
    var i, n;
    var div = document.createElement('div');
    var template = arguments[0];
    var html = template[0];
    for (i = 1; i < template.length; i++) {
      html += arguments.length > i ? arguments[i] + template[i] : template[i];
    }
    div.innerHTML = html;

    var ins = Object.create(Jinkela.prototype, { element: { value: div, configurable: true } });
    Jinkela.call(ins);

    var styleTagList = div.getElementsByTagName('style');
    var length = styleTagList.length;
    if (length) {
      var classId = 'html-temp-' + increment++;
      ins.element.setAttribute('jinkela-class', classId);
      var cssPreprocessor = Jinkela.cssPreprocessor;
      for (i = 0; i < length; i++) {
        for (n = styleTagList[i].firstChild; n; n = n.nextSibling) {
          n.data = n.data.replace(/:scope\b/g, '[jinkela-class="' + classId + '"]');
          if (typeof cssPreprocessor === 'function') n.data = cssPreprocessor(n.data);
        }
      }
    }
    return ins;
  };

/**/ }(); /**/
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
        | ((@[^{]+)\{)              # at block start
        | (.)                       # other character
  */
  var tokenize = /((['"])(?:\\\2|.)*?\2)|({)|(})|(;)|((@[^{]+)\{)|(.)/g;
  var gen = [];
  var startPos = 0;
  var selectorStack = [ [ '' ] ];
  var propertyStack = [];
  var properties = [];
  var inAtBlock = 0;
  for (var match; (match = tokenize.exec(styleSheet));) {
    var warn = function (message) {
      var parsed = styleSheet.slice(0, match.index + 1);
      var ch = parsed.match(/.*$/)[0].length;
      var line = parsed.length - parsed.replace(/\n/g, '').length + 1;
      console.warn(message + ' at line ' + line + ', column ' + ch + '\n' + parsed); // eslint-disable-line
    };
    switch (true) {
      // block start
      case match[3] !== void 0:
        propertyStack.push(properties);
        properties = [];
        if (inAtBlock > 0) inAtBlock++;
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
        if (inAtBlock > 0 && --inAtBlock === 0) {
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
      // at block start
      case match[6] !== void 0:
        if (selectorStack.length > 1) {
          warn('unexpected @ block');
          return styleSheet;
        }
        propertyStack.push(properties);
        properties = [];
        inAtBlock++;
        gen.push(match[7], '{', '\n');
        selectorStack.push([ '' ]);
        startPos = match.index + match[6].length + 1;
        break;
    }
  }
  return gen.join('');
};
Object.defineProperty(Jinkela, 'from', {
  configurable: true,
  value: function(raw) {
    if (raw instanceof Array) {
      var result = [];
      for (var i = 0; i < raw.length; i++) result.push(new this(raw[i]));
      var to = function(target) {
        for (var i = 0; i < raw.length; i++) result[i].to(target);
        return this;
      };
      Object.defineProperty(result, 'renderTo', { configurable: true, value: to });
      Object.defineProperty(result, 'to', { configurable: true, value: to });
      return result;
    } else {
      return new this(raw);
    }
  }
});
addEventListener('DOMContentLoaded', function() {

  var meta = document.querySelector('meta[name=jinkela]') || {};
  if (/(^|,)\s*auto=(yes|true|1)\s*(,|$)/.test(meta.content)) {
    Jinkela.call(Object.create(window, {
      element: { value: document.documentElement, configurable: true },
      template: { value: document.documentElement.outerHTML, configurable: true }
    }));
  }

});
Jinkela.register({

  pattern: /^on-/,
  priority: 100,

  handler: function(that, node, ownerElement) {

    that['@@beforeInit'].push(function() {

      var eventName = node.nodeName.match(/^on-(.*)|$/)[1];
      var list = ownerElement['@@binding']; // Get once element list in timing @@beforeInit

      var handler = typeof node.jinkelaValue === 'function' && node.jinkelaValue.bind(that);
      if (handler) list.forEach(function(element) { element.addEventListener(eventName, handler); });

      node['@@subscribers'].push(function() {
        if (handler) list.forEach(function(element) { element.removeEventListener(eventName, handler); });
        handler = typeof node.jinkelaValue === 'function' && node.jinkelaValue.bind(that);
        if (handler) list.forEach(function(element) { element.addEventListener(eventName, handler); });
      });

    });

  }

});
Jinkela.register({

  pattern: /^JKL(?:-[A-Z0-9]+)+$/,
  priority: 30,

  handler: function(that, node) {

    // Convert tagName to component name
    var name = node.tagName.slice(4).replace(/(?!^)-?./g, function(str) { return str.length > 1 ? str[1] : str.toLowerCase(); });

    // Get component class
    var Component = that[name] || new Function('return typeof ' + name + ' === \'function\' && ' + name + ';')();
    if (!Component) throw new Error('No component can be matched with ' + node.tagName);

    that['@@beforeInit'].push(function() {
      var attrs = node.attributes;
      var args = {};
      var i;
      for (i = 0; i < attrs.length; i++) {
        args[attrs[i].nodeName] = 'jinkelaValue' in attrs[i] ? attrs[i].jinkelaValue : attrs[i].value;
      }
      // Init component instance
      var component = node.component = Component && new Component(args, { children: [].slice.call(node.childNodes, 0) });
      node['@@binding'] = component.element;
      for (i = 0; i < attrs.length; i++) {
        if (attrs[i]['@@subscribers'] instanceof Array) {
          attrs[i]['@@subscribers'].push(function(target) { component[target.nodeName] = target.jinkelaValue; });
        } else {
          // WTF??
        }
      }
    });

  }

});
Jinkela.register({

  pattern: /^if(-not)?$/,
  priority: 20,

  handler: function(that, node, ownerElement) {
    var not = node.name === 'if-not';
    var comment = ' ' + node.name + '="' + node.value + '" ';
    var replacement = document.createComment(comment);
    var state = true;

    var desc = Object.getOwnPropertyDescriptor(ownerElement, '@@binding');
    var current = [ ownerElement ];
    Object.defineProperty(ownerElement, '@@binding', {
      configurable: true,
      get: function() { return current; },
      set: function(list) {
        current = [].concat(list);
        if (state) desc.set.call(ownerElement, current);
      }
    });

    var change = function() {
      var condition = 'jinkelaValue' in node ? node.jinkelaValue : node.value;
      replacement.textContent = comment + 'where ' + condition + ' ';
      condition = !!condition ^ not;
      if (state === condition) return;
      if (condition) {
        desc.set.call(ownerElement, current);
      } else {
        desc.set.call(ownerElement, replacement);
      }
      state = condition;
    };

    that['@@beforeInit'].push(function() {
      change();
      node['@@subscribers'].push(change);
    });
  }

});
Jinkela.register({

  pattern: /^ref$/,
  priority: 40,

  handler: function(that, node, ownerElement) {

    var fixNode = function(item) {
      if (item == null) item = document.createComment(' ' + item + ' '); // eslint-disable-line
      if (item instanceof Node && item.component) item = item.component;
      if (item instanceof Jinkela) item = item.element;
      if (!(item instanceof Node)) item = document.createTextNode(item);
      return item;
    };

    var name = node.value;

    var desc, hasSet, originalValue;
    for (var i = that; i && !desc; i = Object.getPrototypeOf(i)) desc = Object.getOwnPropertyDescriptor(i, name);

    Object.defineProperty(that, name, {
      configurable: true,
      enumerable: true,
      get: function() { return hasSet ? originalValue : ownerElement.component || ownerElement; },
      set: function(what) {
        if (originalValue === what) return;
        var list = [ document.createComment(' ref="' + name + '" ') ].concat(what).map(fixNode);
        ownerElement['@@binding'] = list;
        hasSet = true;
        originalValue = what;
        if (desc && desc.set) desc.set.call(that, what);
      }
    });

    that['@@beforeInit'].push(function() {
      if (desc && desc.get) {
        that[name] = desc.get.call(that);
      } else {
        if (desc && desc.value !== void 0) that[name] = desc.value;
      }
    });

  }

});
  return Jinkela;
});

/**/ });
