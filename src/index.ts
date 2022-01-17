import { SlotVar, HtmlBuilder } from './HtmlBuilder';
import { createState } from './StateManager';
import { request } from './stdlib/request';

export { createState, request };

export const jkl = ({ raw }: { raw: ArrayLike<string> }, ...vars: SlotVar[]) => {
  const { root } = new HtmlBuilder(raw, vars);
  return root;
};
