Jinkela.register(/^on-/, function(that, node) {
  var element = node.ownerElement;
  var eventName = node.nodeName.match(/^on-(.*)|$/)[1];
  return function(handler) {
    if (typeof handler !== 'function') return;
    element.addEventListener(eventName, handler.bind(that));
  };
});
