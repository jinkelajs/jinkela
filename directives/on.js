Jinkela.register(/^on-/, function(that, node, ownerElement) {
  if (ownerElement.component) ownerElement = ownerElement.component.element;
  var eventName = node.nodeName.match(/^on-(.*)|$/)[1];
  return function(handler) {
    if (typeof handler !== 'function') return;
    ownerElement.addEventListener(eventName, handler.bind(that));
  };
});
