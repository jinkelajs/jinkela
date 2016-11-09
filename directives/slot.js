Jinkela.register('SLOT', function(that, node) {
  let name = node.getAttribute('name');
  for (let i = 0; i < that.children.length; i++) {
    let child = that.children[i];
    if (child.getAttribute('slot') !== name) continue;
    child = child.element || child;
    node.parentNode.insertBefore(child, node);
  }
  node.remove();
});
