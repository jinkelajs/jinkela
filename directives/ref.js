Jinkela.register({

  pattern: /^ref$/,
  priority: 20,

  handler: function(that, node, ownerElement) {

    var fixNode = function(item) {
      if (item == null) item = document.createComment(' ' + item + ' '); // eslint-disable-line
      if (item instanceof Node && item.component) item = item.component;
      if (item instanceof Jinkela) item = item.element;
      if (!(item instanceof Node)) item = document.createTextNode(item);
      return item;
    };

    var name = node.value;

    var desc;
    for (var i = that; i && !desc; i = Object.getPrototypeOf(i)) desc = Object.getOwnPropertyDescriptor(i, name);

    var storage = { originalList: [ ownerElement ] };
    Object.defineProperty(that, name, {
      configurable: true,
      enumerable: true,
      get: function() { return 'originalValue' in storage ? storage.originalValue : ownerElement.component || ownerElement; },
      set: function(what) {
        if ('originalValue' in storage && storage.originalValue === what) return;
        var list = [ document.createComment(' ref="' + name + '" ') ].concat(what).map(fixNode);
        var parent = storage.originalList[0].parentNode;
        if (parent) {
          for (var i = 0; i < list.length; i++) parent.insertBefore(list[i], storage.originalList[0]);
          for (var i = 0; i < storage.originalList.length; i++) parent.removeChild(storage.originalList[i]);
        }
        storage.originalValue = what;
        storage.originalList = list;
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
