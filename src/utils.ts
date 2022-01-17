const SC_TAGS = [
  'AREA',
  'BASE',
  'BR',
  'COL',
  'EMBED',
  'HR',
  'IMG',
  'INPUT',
  'LINK',
  'META',
  'PARAM',
  'SOURCE',
  'TRACK',
  'WBR',
] as const;
export const isSelfClosingTag = (tagName: string): tagName is typeof SC_TAGS[number] => {
  return SC_TAGS.indexOf(tagName as any) !== -1;
};

export function assertDefined<T>(what: T): asserts what is Exclude<T, undefined> {
  if (what === undefined) throw new TypeError('Assert Not Defined');
}

export function assertNotNull<T>(what: T): asserts what is Exclude<T, null> {
  if (what === null) throw new TypeError('Assert Not Null');
}

export function assertToken<T extends string>(what: unknown, ...tokens: T[]): asserts what is T {
  if (tokens.indexOf(what as any) === -1) throw new TypeError(`Assert Token ${tokens.map((i) => `'${i}'`).join(', ')}`);
}
