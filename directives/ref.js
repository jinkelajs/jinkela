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
            var fragment = document.createDocumentFragment();
            element.forEach(function(item) { fragment.appendChild(fixNode(item)); });
            fragment.originalList = element;
            element = fragment;
          } else {
            element = document.createComment(' empty list ');
          }
        } else {
          element = fixNode(element);
        }
        var parent;
        if (ownerElement instanceof DocumentFragment) {
          var first = ownerElement.originalList[0];
          if (parent = first.parentNode) {
            parent.insertBefore(element, first);
            ownerElement.originalList.forEach(function(item) {
              if (item.parentNode) item.parentNode.removeChild(item);
            });
          }
          ownerElement = element;
        } else if (element !== ownerElement) {
          if (parent = ownerElement.parentNode) {
            parent.insertBefore(element, ownerElement);
            if (ownerElement.parentNode) ownerElement.parentNode.removeChild(ownerElement);
          }
          ownerElement = element;
        }
      }
    });
  }

});
