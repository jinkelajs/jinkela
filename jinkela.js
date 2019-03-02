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

// Accessor props maybe overrided by class-fields, change class-fields to assignings in next tick
var fixClassFields = function(that) {
  var before = Object.getOwnPropertyDescriptors(that);
  window.Promise.resolve().then(function() {
    var after = Object.getOwnPropertyDescriptors(that);
    for (var key in after) {
      if (!('value' in after[key])) continue;
      if (before[key] && !('value' in before[key])) {
        Object.defineProperty(that, key, before[key]);
        that[key] = after[key].value;
      }
    }
  });
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
  // Avoid accessor props overridden by class-fields
  if (window.Promise) fixClassFields(this);
};

// Prototype Properties
getOnce(Jinkela.prototype, 'element', function() {
  var target = this.constructor;
  var key = '@@domCache';
  if (!target.hasOwnProperty(key)) {
    var element;
    var template = this.constructor.template || this.template;
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
