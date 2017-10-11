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
