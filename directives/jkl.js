Jinkela.register(/^JKL(?:-[A-Z0-9]+)+$/, function(that, node) {
  // Convert tagName to component name
  var name = node.tagName.slice(4).replace(/(?!^)-?./g, function(str) {
    return str.length > 1 ? str[1] : str.toLowerCase();
  });
  // Get component class
  var Component = that[name] || new Function('return typeof ' + name + ' === \'function\' && ' + name + ';')();
  if (!Component) throw new Error('No component can be matched with ' + node.tagName);
  // Prepare constructing args
  var args = {};
  var attrs = node.attributes;
  var watches = that['@@watches'];
  for (var i = 0; i < attrs.length; i++) {
    var nodeName = attrs[i].nodeName;
    var value = attrs[i].value;
    var matches = /^\{([$_a-zA-Z][$\w]*)\}$/.exec(value);
    if (matches) {
      var propName = matches[1];
      var listeners = propName in watches ? watches[propName] : watches[propName] = [];
      listeners.push(function(nodeName, value) {
        if (component) component[nodeName] = value;
      }.bind(null, nodeName));
    } else {
      args[nodeName] = value;
    }
  }
  // Init component instance
  var component = Component && new Component(args, { children: [].slice.call(node.childNodes, 0) });
  node.component = component;
  component.renderWith(node);
});
