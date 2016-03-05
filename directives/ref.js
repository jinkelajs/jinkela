Jinkela.register('ref', function(that, node, ownerElement) {
  that[node.value] = ownerElement;
  Object.defineProperty(that, node.value, {
    configurable: true,
    enumerable: true,
    get: function() { return ownerElement; },
    set: function(element) {
      if (element instanceof Jinkela) element = element.element;
      var parent = ownerElement.parentNode;
      if (parent) {
        parent.insertBefore(element, ownerElement);
        parent.removeChild(ownerElement);
      }
      ownerElement = element;
    }
  });
});
