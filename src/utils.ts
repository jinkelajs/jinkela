const SC_TAGS = new Set([
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
] as const);

export const isSelfClosingTag = (tagName: string): tagName is typeof SC_TAGS extends Set<infer U> ? U : never => {
  return SC_TAGS.has(tagName as any);
};

export function assertInstanceOf<T, C extends abstract new (...a: any) => any>(
  what: T,
  clz: C,
): asserts what is InstanceType<C> {
  if (!(what instanceof clz)) throw new TypeError('Assert InstanceOf');
}

export function assertDefined<T>(what: T): asserts what is Exclude<T, undefined> {
  if (what === undefined) throw new TypeError('Assert Defined');
}

export function assertNotNull<T>(what: T): asserts what is Exclude<T, null> {
  if (what === null) throw new TypeError('Assert Not Null');
}

export function assertToken<T extends string>(what: unknown, ...tokens: T[]): asserts what is T {
  if (tokens.indexOf(what as any) === -1) throw new TypeError(`Assert Token ${tokens.map((i) => `'${i}'`).join(', ')}`);
}

export function isValueType(what: unknown): what is string | number | boolean {
  return typeof what === 'string' || typeof what === 'number' || typeof what === 'boolean';
}

export type Var = number | string | boolean | null | undefined | Node;

export type VarOrList = Var | Var[];

export type SlotVar = VarOrList | (() => VarOrList) | ((e?: Event) => void);

export type Fn = () => void;

export const uDiff = <T>(o: T[], n: T[], a: Record<'add' | 'delete' | 'modify', (i: T) => void>) => {
  const s = new Set(n);
  for (let i = 0; i < o.length; i++) {
    if (s.delete(o[i])) {
      a.modify(o[i]);
    } else {
      a.delete(o[i]);
    }
  }
  s.forEach((i) => a.add(i));
};

/**
 * Convert Variable to Value.
 */
export const v2v = (w: unknown) => (typeof w === 'function' ? w() : w);

/**
 * Convert Variable List to String.
 */
export const vl2s = (a: any[]) => a.map(v2v).join('');
