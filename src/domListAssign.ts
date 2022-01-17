import { IndexedArray } from './IndexedArray';
import { assertNotNull } from './utils';

const fragNodesMap = new WeakMap<DocumentFragment, Node[]>();

const getChildNodesFromDF = (frag: DocumentFragment) => {
  const list = fragNodesMap.get(frag);
  if (list) return list;
  const newList = Array.from(frag.childNodes);
  fragNodesMap.set(frag, newList);
  return newList;
};

const toNodeList = (value: any) => {
  const array = new IndexedArray<Node>();
  const collect = (item: any) => {
    if (item instanceof DocumentFragment) {
      const childNodes = getChildNodesFromDF(item);
      for (let i = 0; i < childNodes.length; i++) {
        array.push(childNodes[i]);
      }
    } else if (item instanceof Node) array.push(item);
    else if (item === null || item === undefined) array.push(document.createComment(` ${item} `));
    else array.push(document.createTextNode(String(item)));
  };
  if (value instanceof Array) {
    for (let i = 0; i < value.length; i++) collect(value[i]);
  } else collect(value);
  // Put a comment node as placeholder to prevent array empty.
  if (array.length === 0) array.push(document.createComment(` empty list `));
  return array;
};

export const domListAssign = (oldList: IndexedArray<Node>, newValue: any) => {
  // Convert to Node[].
  const newList = toNodeList(newValue);

  const firstItem = oldList.get(0);
  assertNotNull(firstItem);

  const { parentNode } = firstItem;
  assertNotNull(parentNode);

  // Classfiy
  const intersection = [] as Node[];
  for (let i = 0; i < newList.length; i++) {
    const n = newList.get(i);
    assertNotNull(n);
    if (oldList.includes(n)) {
      intersection.push(n);
    }
  }
  let anchor: Node | null = null;
  const removing: Node[] = [];
  for (let i = 0; i < oldList.length; i++) {
    const o = oldList.get(i);
    assertNotNull(o);
    if (newList.includes(o)) {
      if (!anchor) anchor = o;
    } else {
      removing.push(o);
    }
  }

  // Sort intersection.
  for (let i = 0; i < intersection.length; i++) {
    const n = intersection[i];
    assertNotNull(n);
    if (n === anchor) {
      anchor = n.nextSibling;
      // Move to next sibling if anchor in removing set, it's used for performance.
      while (anchor && oldList.includes(anchor) && !newList.includes(anchor)) {
        anchor = anchor.nextSibling;
      }
    } else {
      parentNode.insertBefore(n, anchor);
    }
  }

  // Insert addition.
  {
    let cursor = 0;
    let anchor: Node | null = null;
    for (let i = 0; i < intersection.length; i++) {
      anchor = intersection[i];
      assertNotNull(anchor);
      const index = newList.indexOf(anchor);
      while (cursor < index) {
        const a = newList.get(cursor);
        assertNotNull(a);
        parentNode.insertBefore(a, anchor);
        cursor++;
      }
      cursor++;
    }
    if (anchor) {
      anchor = anchor.nextSibling;
    } else {
      anchor = oldList.get(0);
    }
    while (cursor < newList.length) {
      const a = newList.get(cursor);
      assertNotNull(a);
      parentNode.insertBefore(a, anchor);
      cursor++;
    }
  }

  // Delete
  for (let i = 0; i < removing.length; i++) {
    parentNode.removeChild(removing[i]);
  }

  return newList;
};
