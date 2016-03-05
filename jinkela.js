/**/ 'use strict';
/**/ void function() { /**/

// Polyfill document.currentScript for IE10-
document.currentScript === void 0 && Object.defineProperty(document, 'currentScript', {
  get: function() {
    var scripts = document.getElementsByTagName('script');
    for (var i = 0, script; script = scripts[i]; i++) {
      if (script.readyState === 'interactive') return script;
    }
    return null;
  }
});

// To store the jinkela-class in styleSheet
var head = document.documentElement.firstChild;
var getStylePool = function() {
  if (getStylePool.cache) return getStylePool.cache;
  var style = document.createElement('style');
  head.appendChild(style);
  return getStylePool.cache = style;
};

// To generate a unique id
var createId = function() { return createId.i = createId.i + 1 || 1; };

// Walk the tree and change "{xxx}" template to accessor properties.
var parseTempaltePropMap = { 2: 'value', 3: 'data' };
var parseTempalte = function(that) {
  var watches = Object.create(null);
  // Walking and match special templates into "watches"
  void function callee(node, ownerElement) {
    var attrs, child, handler, attr, i;
    // Try to match directive
    if (directives[node.nodeName]) {
      handler = directives[node.nodeName](that, node, ownerElement);
    } else {
      for (i = 0; i < directivesR.length; i++) {
        if (directivesR[i].regexp.test(node.nodeName)) {
          handler = directivesR[i].factory(that, node, ownerElement);
          break;
        }
      }
    }
    // Try to match binding node (textNode or attrNode) and save if matched
    if (/^\{([$_a-zA-Z][$\w]*)\}$/.test(node[parseTempaltePropMap[node.nodeType]])) {
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
    Object.defineProperty(that, name, {
      get: function() { return cache; },
      set: function(value) {
        cache = value;
        for (var i = 0; i < list.length; i++) {
          if (typeof list[i] === 'function') {
            list[i].call(that, value);
          } else {
            list[i][parseTempaltePropMap[list[i].nodeType]] = value;
          }
        }
      }
    });
    that[name] = value;
  }(name);
};

// To build and cache instance tempalte and return an element instance
var buildTempalteTagMap = { td: 'tr', 'th': 'tr', tr: 'tbody', tbody: 'table', thead: 'table', tfoot: 'table' };
var buildTempalte = function(that) {
  var target = that.constructor;
  if (!target.jinkela) {
    var template = that.template || '<div></div>';
    // Some element require specifial parent element
    var tagName = String(template.replace(/<!--[\s\S]*?-->/g, '').match(/<([a-z][\w-]*)|$/i)[1]).toLowerCase();
    // Build template
    target.jinkela = document.createElement(buildTempalteTagMap[tagName] || 'jinkela');
    target.jinkela.innerHTML = template;
    if (target.jinkela.children.length !== 1) throw new Error('Jinkela: Template require 1 root element');
    target.jinkela = target.jinkela.firstElementChild;
    // Build styleSheet as a style tag
    var styleSheet = that.styleSheet;
    if (styleSheet) {
      var classId = createId();
      target.jinkela.setAttribute('jinkela-class', classId);
      styleSheet = styleSheet.replace(/:scope\b/g, '[jinkela-class="' + classId + '"]');
      if (typeof Jinkela.cssPreprocessor === 'function') styleSheet = Jinkela.cssPreprocessor(styleSheet);
      getStylePool().insertAdjacentHTML('beforeend', styleSheet);
    }
  }
  return target.jinkela.cloneNode(true);
};

// Main Constructor
var Jinkela = function() {
  Object.defineProperty(this, 'element', { value: buildTempalte(this) });
  parseTempalte(this);
  // Find all "init" method list in prototype chain and call they
  var list = [];
  for (var i = this; i; i = Object. getPrototypeOf(i)) {
    var desc = Object.getOwnPropertyDescriptor(i, 'init');
    if (!desc || typeof desc.value !== 'function') continue;
    list.push(desc.value);
  }
  while (list.length) list.pop().apply(this, arguments);
};

// Method Definations
Object.defineProperty(Jinkela.prototype, 'didMountHandlers', { value: [] });
var createRender = function(name, handler) {
  Object.defineProperty(Jinkela.prototype, name, {
    value: function() {
      handler.apply(this, arguments);
      for (var i = 0; i < this.didMountHandlers.length; i++) this.didMountHandlers[i].call(this);
      return this;
    }
  });
};
createRender('renderHere', function() {
  var element = document.currentScript;
  if (!element || !element.parentNode) throw new Error('Jinkela: "renderHere" must call synchronously');
  element.parentNode.insertBefore(this.element, element);
});
createRender('renderTo', function(target) {
  if (target instanceof Jinkela) target = target.element;
  target.appendChild(this.element);
});
createRender('renderWith', function(target) {
  if (target instanceof Jinkela) target = target.element;
  target.parentNode.replaceChild(this.element, target);
});

// Directive register
var directives = Object.create(null);
var directivesR = [];
Jinkela.register = function(type, factory) {
  if (type instanceof RegExp) {
    directivesR.push({ regexp: type, factory: factory });
  } else {
    directives[type] = factory;
  }
};

// Export to global
window.Jinkela = Jinkela;

/**/ }(); /**/
