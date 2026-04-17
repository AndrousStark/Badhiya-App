/**
 * Team schema helpers — tests the non-undefined fallback behavior
 * of the meta getters added during the Phase-11 type-safety pass.
 * These helpers are called from team list rows, so a regression
 * would render "undefined.color" and crash the screen.
 */

import { getRoleMeta, getAttendanceMeta, ROLE_META, ATTENDANCE_META } from './schemas';

describe('getRoleMeta', () => {
  it('returns the exact entry for each known role', () => {
    for (const role of ['owner', 'manager', 'staff', 'accountant']) {
      const meta = getRoleMeta(role);
      expect(meta).toBe(ROLE_META[role]);
      expect(meta.label).toBeTruthy();
      expect(meta.labelHi).toBeTruthy();
      expect(meta.color).toMatch(/^#[0-9A-F]{6}$/i);
    }
  });

  it('falls back to staff for unknown roles', () => {
    expect(getRoleMeta('delivery-boy')).toEqual(ROLE_META.staff);
    expect(getRoleMeta('')).toEqual(ROLE_META.staff);
  });

  it('never returns undefined', () => {
    const inputs = ['', 'unknown', '__proto__', 'constructor', 'toString'];
    for (const i of inputs) {
      expect(getRoleMeta(i)).toBeDefined();
    }
  });
});

describe('getAttendanceMeta', () => {
  it('returns the exact entry for each known status', () => {
    for (const status of [
      'present',
      'absent',
      'half_day',
      'overtime',
      'late',
      'paid_holiday',
    ]) {
      const meta = getAttendanceMeta(status);
      expect(meta).toBe(ATTENDANCE_META[status]);
      expect(meta.emoji).toBeTruthy();
    }
  });

  it('falls back to absent for unknown status', () => {
    expect(getAttendanceMeta('sick-leave')).toEqual(ATTENDANCE_META.absent);
  });
});
