/**/ 'use strict';
/**/ void function() { /**/

var STRICT_TAG = { td: 'tr', 'th': 'tr', tr: 'tbody', tbody: 'table', thead: 'table', tfoot: 'table' };
var NODE_TYPE_NAME = { 2: 'value', 3: 'data' };
var increment = 1;

// Util Definitions
var getShadedProps = function(that, propName) {
  var list = [];
  for (var i = that; i; i = Object.getPrototypeOf(i)) {
    var desc = Object.getOwnPropertyDescriptor(i, propName);
    desc && list.push(desc.get ? desc.get.call(that) : desc.value);
  }
  return list;
};
var getOnce = function(base, name, getter) {
  Object.defineProperty(base, name, {
    configurable: true,
    get: function() {
      return Object.defineProperty(this, name, { value: getter.call(this) })[name];
    }
  });
};

// Walk the tree and change "{xxx}" template to accessor properties.
var parseTempalte = function(that) {
  var watches = Object.create(null);
  // Walking and match special templates into "watches"
  void function callee(node, ownerElement) {
    var attrs, child, handler, attr, i;
    // Try to match directive
    if (directivesWithType[node.nodeName]) {
      handler = directivesWithType[node.nodeName](that, node, ownerElement);
    } else {
      for (i = 0; i < directivesWithRegExp.length; i++) {
        if (directivesWithRegExp[i].regexp.test(node.nodeName)) {
          handler = directivesWithRegExp[i].factory(that, node, ownerElement);
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
    Object.defineProperty(that, name, {
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
  if (typeof this.beforeParse === 'function') this.beforeParse();
  parseTempalte(this);
  // Extends each arguments to this
  if (typeof this.beforeExtends === 'function') this.beforeExtends();
  this.extends.apply(this, arguments);
  // Find all "init" method list in prototype chain and call they
  var list = getShadedProps(this, 'init');
  while (list.length) list.pop().apply(this, arguments);
};

// Prototype Properties
getOnce(Jinkela.prototype, 'element', function() {
  var target = this.constructor;
  if (!target.hasOwnProperty('domCache')) {
    var template = this.template || '<div></div>';
    // Some element require specifial parent element
    var tagName = String(template.replace(/<!--[\s\S]*?-->/g, '').match(/<([a-z][\w-]*)|$/i)[1]).toLowerCase();
    // Build template
    var element = target.domCache = document.createElement(STRICT_TAG[tagName] || 'jinkela');
    element.innerHTML = template;
    if (element.children.length !== 1) throw new Error('Jinkela: Template require 1 root element');
    element = target.domCache = element.firstElementChild;
    // Build styleSheet as a style tag
    var styleSheet = this.styleSheet;
    // Find all shaded "styleSheet" from prototype chain
    var styleSheetList = getShadedProps(this, 'styleSheet');
    if (styleSheetList.length) {
      var classId = increment++;
      element.setAttribute('jinkela-class', classId);
      styleSheet = styleSheetList.reverse().join('\n').replace(/:scope\b/g, '[jinkela-class="' + classId + '"]');
      if (typeof Jinkela.cssPreprocessor === 'function') styleSheet = Jinkela.cssPreprocessor(styleSheet);
      Jinkela.style.insertAdjacentHTML('beforeend', styleSheet);
    }
  }
  return target.domCache.cloneNode(true);
});
getOnce(Jinkela.prototype, 'didMountHandlers', function() { return []; });
getOnce(Jinkela, 'style', function() {
  return document.documentElement.firstChild.appendChild(document.createElement('style'));
});

// Method Definations
Object.defineProperty(Jinkela.prototype, 'extends', {
  configurable: true,
  value: function() {
    for (var i = 0; i < arguments.length; i++) {
      var arg = arguments[i];
      if (arg instanceof Object) for (var j in arg) this[j] = arg[j];
    }
  }
});
var createRender = function(name, handler) {
  Object.defineProperty(Jinkela.prototype, name, {
    value: function() {
      handler.apply(this, arguments);
      for (var i = 0; i < this.didMountHandlers.length; i++) this.didMountHandlers[i].call(this);
      return this;
    }
  });
};
createRender('renderTo', function(target) {
  if (target instanceof Jinkela) target = target.element;
  target.appendChild(this.element);
});
createRender('renderWith', function(target) {
  if (target instanceof Jinkela) target = target.element;
  target.parentNode.replaceChild(this.element, target);
});

// Directive register
var directivesWithType = Object.create(null);
var directivesWithRegExp = [];
Jinkela.register = function(type, factory) {
  if (type instanceof RegExp) {
    directivesWithRegExp.push({ regexp: type, factory: factory });
  } else {
    directivesWithType[type] = factory;
  }
};

// Export to global
window.Jinkela = Jinkela;

/**/ }(); /**/
