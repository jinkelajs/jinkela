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
var callArray = function(array, that) { for (var i = 0; i < array.length; i++) array[i].call(that); };

// Walk the tree and change "{xxx}" template to accessor properties.
var parseTemplate = function(that) {
  var watches = Object.create(null);
  define(that, '@@watches', { value: watches });
  // Walking and match special templates into "watches"
  void function callee(node, ownerElement) {
    var attrs, sibling, handler, attr, i;
    var child = node.firstChild;
    if (node.nodeType === 1) {
      while (child) {
        sibling = child.nextSibling;
        callee(child);
        child = sibling;
      }
    }
    // Try to match directive
    if (directives.type[node.nodeName]) {
      handler = directives.type[node.nodeName](that, node, ownerElement);
    } else {
      for (i = 0; i < directives.regexp.length; i++) {
        if (directives.regexp[i].regexp.test(node.nodeName)) {
          handler = directives.regexp[i].factory(that, node, ownerElement);
          break;
        }
      }
    }
    // Try to match binding node (textNode or attrNode) and save if matched
    if (/^\{([$_a-zA-Z][$\w]*)\}$/.test(node[NODE_TYPE_NAME[node.nodeType]])) {
      (RegExp.$1 in watches ? watches[RegExp.$1] : watches[RegExp.$1] = []).push(handler || node);
    }
    if (attrs = node.attributes) for (i = 0; attr = attrs[i]; i++) callee(attr, node);
  }(that.element);
  // Change "watches" to accessor properties
  for (var name in watches) void function(name) {
    var list = watches[name];
    var value = that[name];
    var cache;
    define(that, name, {
      enumerable: true,
      get: function() { return cache; },
      set: function(value) {
        cache = value;
        for (var i = 0; i < list.length; i++) {
          if (typeof list[i] === 'function') {
            list[i].call(that, value);
          } else {
            list[i][NODE_TYPE_NAME[list[i].nodeType]] = value;
          }
        }
      }
    });
    that[name] = value;
  }(name);
};

// Extend special fields to instance before parse
var specialFields = [ 'tagName', 'template', 'styleSheet' ];
var extendSpecialFields = function(that, params) {
  for (var key, i = 0; key = specialFields[i]; i++) {
    if (key in params) {
      Object.defineProperty(that, key, { configurable: true, value: params[key] });
      delete params[key];
    }
  }
};

// Main Constructor
var Jinkela = function() {
  var params = {};
  this.extends.apply(params, arguments);
  if (typeof this.beforeParse === 'function') this.beforeParse(params); // Expirimental
  extendSpecialFields(this, params);
  parseTemplate(this);
  // Extends each arguments to this
  if (typeof this.beforeExtends === 'function') this.beforeExtends(); // Expirimental
  this.extends(params);
  // Find all "init" method list in prototype chain and call they
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
      var classId = increment++;
      element.setAttribute('jinkela-class', classId);
      var styleSheet = styleSheetList.join('\n').replace(/:scope\b/g, '[jinkela-class="' + classId + '"]');
      if (typeof Jinkela.cssPreprocessor === 'function') styleSheet = Jinkela.cssPreprocessor(styleSheet);
      Jinkela.style.insertAdjacentHTML('beforeend', styleSheet);
    }
    define(target, key, { value: element });
  }
  return target[key].cloneNode(true);
});
getOnce(Jinkela, 'style', function() {
  return document.head.appendChild(document.createElement('style'));
});
getOnce(Jinkela.prototype, '@@didMountHandlers', function() {
  return [ function() { callArray(getShadedProps(this, 'didMount'), this); }.bind(this) ];
});
define(Jinkela.prototype, 'extends', { value: function() {
  for (var i = 0; i < arguments.length; i++) {
    var arg = arguments[i];
    if (arg instanceof Object) for (var j in arg) this[j] = arg[j];
  }
} });
var createRender = function(name, handler) {
  define(Jinkela.prototype, name, { value: function(target) {
    if (!this.hasOwnProperty('parent')) define(this, 'parent', { value: target });
    if (target instanceof Jinkela) target = target.element;
    handler.call(this, target);
    callArray(this['@@didMountHandlers'], this);
    return this;
  } });
};
createRender('to', function(target) { target.appendChild(this.element); });
createRender('prependTo', function(target) { target.insertBefore(this.element, target.firstElementChild); });
createRender('renderTo', function(target) { target.appendChild(this.element); });
createRender('renderWith', function(target) { target.parentNode.replaceChild(this.element, target); });

// Directive register
var directives = { type: Object.create(null), regexp: [] };
Jinkela.register = function(type, factory) {
  if (type instanceof RegExp) {
    directives.regexp.push({ regexp: type, factory: factory });
  } else {
    directives.type[type] = factory;
  }
};

// Export to global
window.Jinkela = Jinkela;

/**/ }(); /**/
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
Jinkela.register(/^if(-not)?$/, function(that, node, ownerElement) {
  if (ownerElement.component) ownerElement = ownerElement.component.element;
  var not = !!RegExp.$1;
  var replacement = new Comment(' ' + node.name + '="' + node.value + '" ');
  var state = true;
  var name = /^\{(.*)\}$|$/.exec(node.value)[1];
  that['@@didMountHandlers'].push(function() { this[name] = this[name]; });
  return function(value) {
    value = !!value ^ not;
    if (state === value) return;
    if (value) {
      if (replacement.parentNode) {
        replacement.parentNode.replaceChild(ownerElement, replacement);
        state = value;
      }
    } else {
      if (ownerElement.parentNode) {
        ownerElement.parentNode.replaceChild(replacement, ownerElement);
        state = value;
      }
    }
  };
});
Jinkela.register(/^JKL(?:-[A-Z0-9]+)+$/, function(that, node) {
  // Convert tagName to component name
  var name = node.tagName.slice(4).replace(/(?!^)-?./g, function(str) {
    return str.length > 1 ? str[1] : str.toLowerCase();
  });
  // Get component class
  var Component = that[name] || new Function('return typeof ' + name + ' === \'function\' && ' + name + ';')();
  if (!Component) throw new Error('No component can be matched with ' + node.tagName);
  // Prepare constructing args
  var args = {};
  var attrs = node.attributes;
  var watches = that['@@watches'];
  for (var i = 0; i < attrs.length; i++) {
    var nodeName = attrs[i].nodeName;
    var value = attrs[i].value;
    var matches = /^\{([$_a-zA-Z][$\w]*)\}$/.exec(value);
    if (matches) {
      var propName = matches[1];
      var listeners = propName in watches ? watches[propName] : watches[propName] = [];
      listeners.push(function(nodeName, value) {
        if (component) component[nodeName] = value;
      }.bind(null, nodeName));
      args[nodeName] = that[propName];
    } else {
      args[nodeName] = value;
    }
  }
  // Init component instance
  var component = Component && new Component(args, { children: [].slice.call(node.childNodes, 0) });
  node.component = component;
  component.renderWith(node);
});
Jinkela.register(/^on-/, function(that, node, ownerElement) {
  if (ownerElement.component) ownerElement = ownerElement.component.element;
  var eventName = node.nodeName.match(/^on-(.*)|$/)[1];
  return function(handler) {
    if (typeof handler !== 'function') return;
    ownerElement.addEventListener(eventName, handler.bind(that));
  };
});
Jinkela.register('ref', function(that, node, ownerElement) {
  var fixNode = function(item) {
    if (item == null) item = new Comment(' ' + item + ' '); // eslint-disable-line
    if (item instanceof Jinkela) item = item.element;
    if (!(item instanceof Node)) item = new Text(item);
    return item;
  };
  // var desc = Object.getOwnPropertyDescriptor(that, node.value);
  // TODO: Consider shaded props
  Object.defineProperty(that, node.value, {
    configurable: true,
    enumerable: true,
    get: function() {
      if (ownerElement instanceof DocumentFragment) {
        return ownerElement.originalList;
      } else {
        return ownerElement.component || ownerElement;
      }
    },
    set: function(element) {
      if (element instanceof HTMLCollection || element instanceof NodeList) element = [].slice.call(element);
      if (element instanceof DocumentFragment) element = [].slice.call(element.childNodes);
      if (element instanceof Array) {
        if (element.length) {
          var fragment = new DocumentFragment();
          element.forEach(function(item) { fragment.appendChild(fixNode(item)); });
          fragment.originalList = element;
          element = fragment;
        } else {
          element = new Comment(' empty list ');
        }
      } else {
        element = fixNode(element);
      }
      var parent;
      if (ownerElement instanceof DocumentFragment) {
        var first = ownerElement.originalList[0];
        if (parent = first.parentNode) {
          parent.insertBefore(element, first);
          ownerElement.originalList.forEach(function(item) { item.remove(); });
        }
        ownerElement = element;
      } else if (element !== ownerElement) {
        if (parent = ownerElement.parentNode) {
          parent.insertBefore(element, ownerElement);
          ownerElement.remove();
        }
        ownerElement = element;
      }
    }
  });
});
  return Jinkela;
});
