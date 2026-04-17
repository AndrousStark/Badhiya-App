/**
 * Customer schema tests — locks the mobile/backend status translation
 * and exercises the customer Zod transform on both well-formed and
 * partial payloads. Khata is one of the most user-visible features,
 * so a regression here would corrupt every customer row.
 */

import { customerSchema, customerStatuses, mapStatus } from './schemas';

describe('mapStatus', () => {
  it.each([
    ['paid', 'paid'],
    ['overdue_60', 'urgent'],
    ['overdue_30', 'aging'],
    ['current', 'ok'],
  ])('maps backend %s to mobile %s', (backend, mobile) => {
    expect(mapStatus(backend)).toBe(mobile);
  });

  it('defaults unknown / null to "ok"', () => {
    expect(mapStatus(undefined)).toBe('ok');
    expect(mapStatus(null)).toBe('ok');
    expect(mapStatus('')).toBe('ok');
    expect(mapStatus('something-new')).toBe('ok');
  });

  it('uses only the exported status union', () => {
    for (const s of [
      'paid',
      'overdue_60',
      'overdue_30',
      'current',
      '__other__',
    ]) {
      expect(customerStatuses).toContain(mapStatus(s));
    }
  });
});

describe('customerSchema transform', () => {
  it('coerces the total_outstanding PG string to a number', () => {
    const parsed = customerSchema.parse({
      id: 'c1',
      name: 'Ravi Kumar',
      total_outstanding: '1250.50',
      status: 'current',
    });
    expect(parsed.totalOutstanding).toBe(1250.5);
    expect(typeof parsed.totalOutstanding).toBe('number');
  });

  it('derives uppercase initial from the name', () => {
    const parsed = customerSchema.parse({
      id: 'c2',
      name: 'kamla devi',
      total_outstanding: 0,
    });
    expect(parsed.initial).toBe('K');
  });

  it('maps status through the backend → mobile translator', () => {
    const parsed = customerSchema.parse({
      id: 'c3',
      name: 'X',
      total_outstanding: 300,
      status: 'overdue_60',
    });
    expect(parsed.status).toBe('urgent');
  });

  it('handles a missing phone field cleanly', () => {
    const parsed = customerSchema.parse({
      id: 'c4',
      name: 'Y',
      total_outstanding: 0,
    });
    expect(parsed.phone).toBeNull();
  });

  it('produces a readable lastPaymentText when fields are absent', () => {
    const parsed = customerSchema.parse({
      id: 'c5',
      name: 'Z',
      total_outstanding: 0,
    });
    expect(typeof parsed.lastPaymentText).toBe('string');
    expect(parsed.lastPaymentText.length).toBeGreaterThan(0);
  });

  it('uses a fallback initial when the name is empty', () => {
    const parsed = customerSchema.parse({
      id: 'c6',
      name: '',
      total_outstanding: 0,
    });
    expect(parsed.initial).toBe('?');
  });
});
