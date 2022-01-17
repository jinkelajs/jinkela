import { StringBuilder } from '../src/StringBuilder';

test('Basic Usage', () => {
  const sb = new StringBuilder();
  for (let i = -1; i < 2; i++) {
    expect(sb.valueOf()).toBe('');
    sb.append('a');
    expect(sb.valueOf()).toBe('a');
    sb.append('b');
    expect(sb.valueOf()).toBe('ab');
    sb.append('c' + i);
    expect(sb.valueOf()).toBe('abc' + i);
    expect(sb.commit()).toBe('abc' + i);
    expect(sb.valueOf()).toBe('');
  }
});

test('Commit Action', () => {
  const sbAction = jest.fn();
  const sb = new StringBuilder(sbAction);
  for (let i = 1; i <= 2; i++) {
    expect(sb.valueOf()).toBe('');
    sb.append('a');
    expect(sb.valueOf()).toBe('a');
    sb.append('b');
    expect(sb.valueOf()).toBe('ab');
    sb.append('c' + i);
    expect(sb.valueOf()).toBe('abc' + i);
    expect(sb.commit()).toBe('abc' + i);
    expect(sb.valueOf()).toBe('');
  }
  expect(sbAction).toHaveBeenCalledTimes(2);
  expect(sbAction).toHaveBeenNthCalledWith(1, 'abc1');
  expect(sbAction).toHaveBeenNthCalledWith(2, 'abc2');
});
