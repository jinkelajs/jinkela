Jinkela.register('if', function(that, node) {
  var replacement = document.createComment(' if ');
  var element = node.ownerElement;
  var state = true;
  return function(value) {
    if (state === !!value) return;
    if (state = !!value) {
      replacement.parentNode.replaceChild(element, replacement);
    } else {
      element.parentNode.replaceChild(replacement, element);
    }
  };
});
