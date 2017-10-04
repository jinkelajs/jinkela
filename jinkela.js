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

// Walk the tree and change "{xxx}" template to accessor properties.
var parseTemplate = function(that, params) {
  var watches = that['@@watches'];
  // Walking and match special templates into "watches"
  void function callee(node, ownerElement) {
    var attrs, sibling, attr, i;
    var child = node.firstChild;
    if (node.nodeType === 1) {
      while (child) {
        sibling = child.nextSibling;
        callee(child);
        child = sibling;
      }
    }
    // Try to match directive
    node['@@subscribers'] = [];
    if (directives.type[node.nodeName]) {
      directives.type[node.nodeName](that, node, ownerElement);
    } else {
      for (i = 0; i < directives.regexp.length; i++) {
        if (directives.regexp[i].regexp.test(node.nodeName)) {
          directives.regexp[i].factory(that, node, ownerElement);
          break;
        }
      }
    }
    // Try to match binding node (textNode or attrNode) and save if matched
    if (/^\{([$_a-zA-Z][$\w]*)\}$/.test(node[NODE_TYPE_NAME[node.nodeType]])) {
      (RegExp.$1 in watches ? watches[RegExp.$1] : watches[RegExp.$1] = []).push(node);
    }
    if (attrs = node.attributes) for (i = 0; attr = attrs[i]; i++) callee(attr, node);
  }(that.element);
  // Change "watches" to accessor properties
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
          list[i].jinkelaValue = list[i][NODE_TYPE_NAME[list[i].nodeType]] = value;
          var subscribers = list[i]['@@subscribers'];
          if (subscribers) for (var j = 0; j < subscribers.length; j++) subscribers[j](list[i]);
        }
      }
    });
    if (!(name in params)) that[name] = cache;
    // Push desc.set to handler list as a watching handler if existed
    if (desc && desc.set) handler = desc.set.bind(that);
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
  for (var i = 0; i < arguments.length; i++) if (arguments[i] instanceof Object) for (var j in arguments[i]) params[j] = arguments[i][j];
  if (typeof this.beforeParse === 'function') this.beforeParse(params); // Expirimental
  extendSpecialFields(this, params);
  parseTemplate(this, params);
  for (name in params) this[name] = params[name]; // Extends
  for(var i = 0; i < this['@@beforeInit'].length; i++) this['@@beforeInit'][i](); // Exec all beforeInit handlers
  // Find all "init" method list in prototype chain and call they
  var args = [ this, arguments ];
  getShadedProps(this, 'init', function(init) { init.apply.apply(init, args); });
};

// Prototype Properties
getOnce(Jinkela.prototype, '@@watches', function() { return Object.create(null); });
getOnce(Jinkela.prototype, '@@beforeInit', function() { return []; });
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
getOnce(Jinkela, 'style', function() {
  return document.head.appendChild(document.createElement('style'));
});
var createRender = function(name, handler) {
  define(Jinkela.prototype, name, { value: function(target) {
    if (target instanceof Jinkela) target = target.element;
    handler.call(this, target);
    return this;
  } });
};
createRender('to', function(target) { target.appendChild(this.element); });
createRender('prependTo', function(target) { target.insertBefore(this.element, target.firstElementChild); });
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
