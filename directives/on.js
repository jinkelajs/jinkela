Jinkela.register(/^on-/, function(that, node, ownerElement) {
  var eventName = node.nodeName.match(/^on-(.*)|$/)[1];
  // Register a beforeInit handler
  that['@@beforeInit'].push(function() {
    if (ownerElement.component) ownerElement = ownerElement.component.element;
    var handler = typeof node.jinkelaValue === 'function' && node.jinkelaValue.bind(that);
    if (handler) ownerElement.addEventListener(eventName, handler);
    node['@@subscribers'].push(function() {
      if (handler) ownerElement.removeEventListener(eventName, handler);
      handler = typeof node.jinkelaValue === 'function' && node.jinkelaValue.bind(that);
      if (handler) ownerElement.addEventListener(eventName, handler);
    });
  });
});
