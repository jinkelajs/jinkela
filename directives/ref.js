Jinkela.register('ref', function(that, node, ownerElement) {
  // var desc = Object.getOwnPropertyDescriptor(that, node.value);
  // TODO: Consider shaded props
  Object.defineProperty(that, node.value, {
    configurable: true,
    enumerable: true,
    get: function() {
      return ownerElement.component || ownerElement;
    },
    set: function(element) {
      if (element == null) element = new Comment(' ' + element + ' ');
      if (element instanceof Jinkela) element = element.element;
      if (!(element instanceof Node)) element = new Text(element);
      var parent = ownerElement.parentNode;
      if (parent) {
        parent.insertBefore(element, ownerElement);
        parent.removeChild(ownerElement);
      }
      ownerElement = element;
    }
  });
});
