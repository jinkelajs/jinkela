export const assertComment = (node: any, value: string) => {
  expect(node).toBeInstanceOf(Comment);
  expect(node.data).toBe(value);
};

export const assertText = (node: any, value: string) => {
  expect(node).toBeInstanceOf(Text);
  expect(node.nodeValue.trim()).toBe(value);
};

export const assertElement = (node: any, tagName: string, content: string) => {
  expect(node).toBeInstanceOf(HTMLElement);
  expect(node.tagName).toBe(tagName);
  expect(node.textContent.trim()).toBe(content);
};
