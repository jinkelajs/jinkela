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

// Create a unique hash
var createUUID = function() {
  return Date.now().toString(36) + '' + Math.floor(Math.random() * Math.pow(36, 10)).toString(36);
};

// Walk the tree and change "{xxx}" template to accessor properties.
var parseTempalte = function(that) {
  var cache = {};
  var watches = Object.create(null);
  // Walking and match special templates into "watches"
  void function callee(node) {
    var name, attrs, child;
    if (typeof node.nodeValue === 'string' && node.nodeValue.match(/^\{([$_a-zA-Z][$\w]*)\}$/g)) {
      name = RegExp.$1;
      (name in watches ? watches[name] : watches[name] = []).push(node);
    }
    if (attrs = node.attributes) for (var attr, i = 0; attr = attrs[i]; i++) callee(attr);
    if (child = node.firstChild) {
      callee(child);
      for (var sibling = child; sibling = sibling.nextSibling; callee(sibling));
    }
  }(that.element);
  // Change "watches" to accessor properties
  for (var name in watches) void function(name) {
    var list = watches[name];
    var value = that[name];
    Object.defineProperty(that, name, {
      set: function(value) {
        cache[name] = value;
        for (var i = 0; i < list.length; i++) {
          // TODO: Directive Injector
          list[i].nodeValue = value;
        }
      },
      get: function() { return cache[name]; }
    });
    that[name] = value;
  }(name);
};

// Some element require specifial parent element
var strictTagMap = { td: 'tr', 'th': 'tr', tr: 'tbody', tbody: 'table', thead: 'table', tfoot: 'table' };

// To build and cache instance tempalte
var buildTempalte = function(that) {
  var target = that.constructor;
  if (!target.jinkela) {
    var template = that.template || '<div></div>';
    var tagName = String(template.replace(/<!--[\s\S]*?-->/g, '').match(/<([a-z][\w-]*)|$/i)[1]).toLowerCase();
    // Build template
    target.jinkela = document.createElement(strictTagMap[tagName] || 'jinkela');
    target.jinkela.innerHTML = template;
    if (target.jinkela.children.length !== 1) {
      throw new Error('Jinkela: Template require ☝️ and only ☝️ root element');
    }
    target.jinkela = target.jinkela.children[0];
    var classId = createUUID();
    target.jinkela.setAttribute('jinkela-class', classId);
    var styleSheet = that.styleSheet;
    if (styleSheet) {
      styleSheet = styleSheet.replace(/:scope\b/g, '[jinkela-class="' + classId + '"]');
      document.documentElement.firstChild.insertAdjacentHTML('beforeend', '<style>' + styleSheet + '</style>');
    }
  }
  return target.jinkela.cloneNode(true);
};

// Init public and private properties
var initProperties = function(that) {
  Object.defineProperties(that, {
    uuid: { value: createUUID() },
    element: { value: buildTempalte(that) }
  });
  /* that.element.setAttribute('jinkela-id', that.uuid); */
};

// Main Constructor
var Jinkela = function(a) {
  initProperties(this);
  parseTempalte(this);
};

// Method Definations
Object.defineProperties(Jinkela.prototype, {
  renderHere: {
    value: function() {
      var currentScript = document.currentScript;
      if (!currentScript || !currentScript.parentNode) {
        throw new Error('Jinkela: I don\'t know where are you 🙈');
      }
      currentScript.parentNode.insertBefore(this.element, currentScript);
      return this;
    }
  },
  renderTo: {
    value: function(target) {
      if (target instanceof Jinkela) target = target.element;
      target.appendChild(this.element);
      return this;
    }
  },
  renderWith: {
    value: function(target) {
      if (target instanceof Jinkela) target = target.element;
      target.parentNode.replaceChild(this.element, target);
      return this;
    }
  }
});

// Export to global
window.Jinkela = Jinkela;

/**/ }(); /**/
