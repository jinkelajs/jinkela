Jinkela.register('if', function(that, node) {
  var replacement = document.createComment(' if ');
  var element = node.ownerElement;
  var state = true;
  var name = node.nodeValue.match(/^\{(.*)\}$|$/)[1];
  that.didMountHandlers.push(function() { this[name] = this[name]; });
  return function(value) {
    if (state === !!value) return;
    if (value) {
      if (replacement.parentNode) {
        replacement.parentNode.replaceChild(element, replacement);
        state = !!value;
      }
    } else {
      if (element.parentNode) {
        element.parentNode.replaceChild(replacement, element);
        state = !!value;
      }
    }
  };
});
