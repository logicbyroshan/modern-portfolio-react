import { describe, expect, it } from 'vitest';
import { safeUrl } from './hydratePortfolio';

describe('safeUrl', () => {
  it('allows http and https urls', () => {
    expect(safeUrl('https://example.com/docs')).toBe('https://example.com/docs');
    expect(safeUrl('http://example.com')).toBe('http://example.com/');
  });

  it('blocks unsafe protocols', () => {
    expect(safeUrl('javascript:alert(1)')).toBe('#');
    expect(safeUrl('data:text/html,hello')).toBe('#');
  });

  it('returns fallback for invalid input', () => {
    expect(safeUrl('http://[::1')).toBe('#');
    expect(safeUrl('', '/fallback')).toBe('/fallback');
  });
});
