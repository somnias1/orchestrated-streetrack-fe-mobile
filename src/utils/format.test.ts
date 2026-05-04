import { formatDate, formatValue, todayISO } from './format';

describe('formatValue', () => {
  it('formats positive integer', () => {
    expect(typeof formatValue(100)).toBe('string');
    expect(formatValue(100)).toContain('100');
  });

  it('formats negative number', () => {
    expect(formatValue(-50)).toContain('50');
  });

  it('formats decimals up to 2 places', () => {
    const result = formatValue(1.5);
    expect(result).toContain('1');
    expect(result).toContain('5');
  });

  it('omits trailing zeros', () => {
    expect(formatValue(100)).not.toContain('.');
  });
});

describe('formatDate', () => {
  it('formats a valid ISO date string', () => {
    const result = formatDate(todayISO());
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('returns original string for an invalid date', () => {
    expect(formatDate('not-a-date')).toBe('not-a-date');
  });

  it('returns original string for empty string', () => {
    expect(formatDate('')).toBe('');
  });
});
