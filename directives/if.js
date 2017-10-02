Jinkela.register(/^if(-not)?$/, function(that, node, ownerElement) {
  var not = !!RegExp.$1;
  var replacement = document.createComment(' ' + node.name + '="' + node.value + '" ');
  var state = true;
  var name = /^\{(.*)\}$|$/.exec(node.value)[1];

  var change = function() {
    var realOwnerElement = ownerElement.component ? ownerElement.component.element : ownerElement;
    var value = 'jinkelaValue' in node ? node.jinkelaValue : node.value;
    value = !!value ^ not;
    if (state === value) return;
    if (value) {
      if (replacement.parentNode) {
        replacement.parentNode.replaceChild(realOwnerElement, replacement);
      }
      state = value;
    } else {
      if (realOwnerElement.parentNode) {
        realOwnerElement.parentNode.replaceChild(replacement, realOwnerElement);
      } else if (that.element === realOwnerElement) {
        var to = that.to;
        Object.defineProperty(that, 'to', {
          configurable: true,
          value: function(element) {
            to.call(state ? that : { element: replacement }, element);
            return that;
          }
        });
      }
      state = value;
    }
  };

  that['@@beforeInit'].push(function() {
    change();
    node['@@subscribers'].push(change);
  });

});
