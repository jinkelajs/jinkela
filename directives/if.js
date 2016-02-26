Jinkela.register('if', function(that, node, ownerElement) {
  var replacement = document.createComment(' if ');
  var state = true;
  var name = /^\{(.*)\}$|$/.exec(node.value)[1];
  that.didMountHandlers.push(function() { this[name] = this[name]; });
  return function(value) {
    if (state === !!value) return;
    if (value) {
      if (replacement.parentNode) {
        replacement.parentNode.replaceChild(ownerElement, replacement);
        state = !!value;
      }
    } else {
      if (ownerElement.parentNode) {
        ownerElement.parentNode.replaceChild(replacement, ownerElement);
        state = !!value;
      }
    }
  };
});
