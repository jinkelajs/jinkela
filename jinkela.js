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
var parseTempalte = function(that) {
  var watches = Object.create(null);
  // Walking and match special templates into "watches"
  void function callee(node, ownerElement) {
    var attrs, child, handler, attr, i;
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
    // Traversing as a binary tree
    if (attrs = node.attributes) for (i = 0; attr = attrs[i]; i++) callee(attr, node);
    if (child = node.firstChild) do { callee(child); } while (child = child.nextSibling);
  }(that.element);
  // Change "watches" to accessor properties
  for (var name in watches) void function(name) {
    var list = watches[name];
    var value = that[name];
    var cache;
    define(that, name, {
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

// Main Constructor
var Jinkela = function() {
  if (typeof this.beforeParse === 'function') this.beforeParse(); // Expirimental
  parseTempalte(this);
  // Extends each arguments to this
  if (typeof this.beforeExtends === 'function') this.beforeExtends(); // Expirimental
  this.extends.apply(this, arguments);
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
  return document.documentElement.firstChild.appendChild(document.createElement('style'));
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
