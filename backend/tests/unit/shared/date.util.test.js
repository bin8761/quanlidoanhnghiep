describe('date.util', () => {
  function loadDateUtil() {
    jest.resetModules();
    return require('../../../src/shared/utils/date.util');
  }

  test('isExpired returns true when expiry is at or before current time', () => {
    const dateUtil = loadDateUtil();
    const expiresAt = new Date('2026-06-03T00:00:00.000Z');
    const currentDate = new Date('2026-06-03T00:00:00.000Z');

    const result = dateUtil.isExpired(expiresAt, currentDate);

    expect(result).toBe(true);
  });

  test('isAfter returns true only when left date is later than right date', () => {
    const dateUtil = loadDateUtil();
    const earlier = new Date('2026-06-03T00:00:00.000Z');
    const later = new Date('2026-06-03T00:01:00.000Z');

    expect(dateUtil.isAfter(later, earlier)).toBe(true);
    expect(dateUtil.isAfter(earlier, later)).toBe(false);
  });

  test('isNotExpired returns true when expiry is after current time', () => {
    const dateUtil = loadDateUtil();
    const expiresAt = new Date('2026-06-03T00:01:00.000Z');
    const currentDate = new Date('2026-06-03T00:00:00.000Z');

    expect(dateUtil.isNotExpired(expiresAt, currentDate)).toBe(true);
  });
});
