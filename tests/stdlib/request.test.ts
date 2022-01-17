import { request } from '../../src/stdlib/request';
import { live } from '../../src/StateManager';

test('Basic Usage', async () => {
  const s = request(async () => {
    return 233;
  });

  const fn = jest.fn();
  live(() => {
    const { loading, data, error } = s;
    return { loading, data, error };
  }, fn);
  expect(fn).toHaveBeenNthCalledWith(1, { loading: true, data: null, error: null });
  await new Promise((f) => setTimeout(f));
  expect(fn).toHaveBeenNthCalledWith(2, { loading: false, data: 233, error: null });
});

test('Error', async () => {
  const s = request(async () => {
    throw 'error';
  });

  const fn = jest.fn();
  live(() => {
    const { loading, data, error } = s;
    return { loading, data, error };
  }, fn);
  expect(fn).toHaveBeenNthCalledWith(1, { loading: true, data: null, error: null });
  await new Promise((f) => setTimeout(f));
  expect(fn).toHaveBeenNthCalledWith(2, { loading: false, data: null, error: 'error' });
});
