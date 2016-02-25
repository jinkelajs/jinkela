Jinkela.register('ref', function(that, node) {
  that[node.nodeValue] = node.ownerElement;
});
