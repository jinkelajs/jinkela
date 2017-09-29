Jinkela.register(/^if(-not)?$/, function(that, node, ownerElement) {
  if (ownerElement.component) ownerElement = ownerElement.component.element;
  var not = !!RegExp.$1;
  var replacement = document.createComment(' ' + node.name + '="' + node.value + '" ');
  var state = true;
  var name = /^\{(.*)\}$|$/.exec(node.value)[1];
  return function(value) {
    value = !!value ^ not;
    if (state === value) return;
    if (value) {
      if (replacement.parentNode) {
        replacement.parentNode.replaceChild(ownerElement, replacement);
      }
      state = value;
    } else {
      if (ownerElement.parentNode) {
        ownerElement.parentNode.replaceChild(replacement, ownerElement);
      } else if (that.element === ownerElement) {
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
});
