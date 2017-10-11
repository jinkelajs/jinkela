Jinkela.register({

  pattern: /^if(-not)?$/,
  priority: 20,

  handler: function(that, node, ownerElement) {
    var not = node.name === 'if-not';
    var comment = ' ' + node.name + '="' + node.value + '" ';
    var replacement = document.createComment(comment);
    var state = true;
    var name = /^\{(.*)\}$|$/.exec(node.value)[1];
    var isRootIf = that.element === ownerElement;

    var desc = Object.getOwnPropertyDescriptor(ownerElement, '@@binding');
    var current = [ ownerElement ];
    Object.defineProperty(ownerElement, '@@binding', {
      configurable: true,
      get: function(list) { return current; },
      set: function(list) {
        current = list;
        if (state) desc.set.call(ownerElement, current);
      }
    });

    var change = function() {
      var condition = 'jinkelaValue' in node ? node.jinkelaValue : node.value;
      replacement.textContent = comment + 'where ' + condition + ' ';
      condition = !!condition ^ not;
      if (state === condition) return;
      if (condition) {
        desc.set.call(ownerElement, current);
      } else {
        desc.set.call(ownerElement, replacement);
      }
      state = condition;
    };

    that['@@beforeInit'].push(function() {
      change();
      node['@@subscribers'].push(change);
    });
  }

});
