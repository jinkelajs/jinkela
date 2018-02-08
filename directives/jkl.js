Jinkela.register({

  pattern: /^JKL(?:-[A-Z0-9]+)+$/,
  priority: 30,

  handler: function(that, node) {

    // Convert tagName to component name
    var name = node.tagName.slice(4).replace(/(?!^)-?./g, function(str) { return str.length > 1 ? str[1] : str.toLowerCase(); });

    // Get component class
    var Component = that[name] || new Function('return typeof ' + name + ' === \'function\' && ' + name + ';')();
    if (!Component) throw new Error('No component can be matched with ' + node.tagName);

    that['@@beforeInit'].push(function() {
      var attrs = node.attributes;
      var args = {};
      for (var i = 0; i < attrs.length; i++) args[attrs[i].nodeName] = 'jinkelaValue' in attrs[i] ? attrs[i].jinkelaValue : attrs[i].value;
      // Init component instance
      var component = node.component = Component && new Component(args, { children: [].slice.call(node.childNodes, 0) });
      node['@@binding'] = component.element;
      for (var i = 0; i < attrs.length; i++) {
        if (attrs[i]['@@subscribers'] instanceof Array) {
          attrs[i]['@@subscribers'].push(function(target) { component[target.nodeName] = target.jinkelaValue; });
        } else {
          // WTF??
        }
      }
    });

  }

});
