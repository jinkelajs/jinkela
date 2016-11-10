Jinkela.register('ref', function(that, node, ownerElement) {
  var fixNode = function(item) {
    if (item == null) item = new Comment(' ' + item + ' ');
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
          element.forEach(item => fragment.appendChild(fixNode(item)));
          fragment.originalList = element;
          element = fragment;
        } else {
          element = new Comment(' empty list ');
        }
      } else {
        element = fixNode(element);
      }
      if (ownerElement instanceof DocumentFragment) {
        var first = ownerElement.originalList[0];
        var parent = first.parentNode;
        if (parent) {
          parent.insertBefore(element, first);
          ownerElement.originalList.forEach(item => item.remove());
        }
        ownerElement = element;
      } else {
        var parent = ownerElement.parentNode;
        if (parent) {
          parent.insertBefore(element, ownerElement);
          ownerElement.remove();
        }
        ownerElement = element;
      }
    }
  });
});
