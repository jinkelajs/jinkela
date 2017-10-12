Jinkela.register({

  pattern: /^on-/,
  priority: 100,

  handler: function(that, node, ownerElement) {

    that['@@beforeInit'].push(function() {

      var eventName = node.nodeName.match(/^on-(.*)|$/)[1];
      var list = ownerElement['@@binding']; // Get once element list in timing @@beforeInit

      var handler = typeof node.jinkelaValue === 'function' && node.jinkelaValue.bind(that);
      if (handler) list.forEach(function(element) { element.addEventListener(eventName, handler); });

      node['@@subscribers'].push(function() {
        if (handler) list.forEach(function(element) { element.removeEventListener(eventName, handler); });
        handler = typeof node.jinkelaValue === 'function' && node.jinkelaValue.bind(that);
        if (handler) list.forEach(function(element) { element.addEventListener(eventName, handler); });
      });

    });

  }

});
