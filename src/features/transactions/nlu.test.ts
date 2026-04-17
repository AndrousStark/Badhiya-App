/**
 * NLU parser tests — pure-function regressions for the voice input
 * pipeline. The parser is the tip of the spear for the app's main
 * differentiator, so regressions must break the build loudly.
 */

import { parseTransaction } from './nlu';

describe('parseTransaction', () => {
  describe('sale detection', () => {
    it('parses simple Hinglish sale with amount', () => {
      const r = parseTransaction('becha 5 kg atta 250 rupaye');
      expect(r.type).toBe('sale');
      expect(r.amount).toBe(250);
      expect(r.confidence).toBeGreaterThan(0.5);
    });

    it('parses reordered sale phrasing', () => {
      const r = parseTransaction('5 kilo aata becha 250 mein');
      expect(r.type).toBe('sale');
      expect(r.amount).toBe(250);
    });

    it('handles the English verb "sold"', () => {
      const r = parseTransaction('sold 2 packet biscuit 80');
      expect(r.type).toBe('sale');
      expect(r.amount).toBe(80);
    });
  });

  describe('expense detection', () => {
    it('parses bill-payment phrasing', () => {
      const r = parseTransaction('bijli bill 4200 diya');
      expect(r.type).toBe('expense');
      expect(r.amount).toBe(4200);
    });

    it('parses a rent expense', () => {
      const r = parseTransaction('rent 8000 diya');
      expect(r.type).toBe('expense');
      expect(r.amount).toBe(8000);
    });

    it('parses "kharcha" as an expense', () => {
      const r = parseTransaction('subzi kharcha 150');
      expect(r.type).toBe('expense');
      expect(r.amount).toBe(150);
    });
  });

  describe('edge cases', () => {
    it('returns a result with null type for empty input', () => {
      const r = parseTransaction('');
      expect(r.type).toBeNull();
      expect(r.amount).toBeNull();
      expect(r.confidence).toBeLessThanOrEqual(0.3);
    });

    it('keeps the raw transcript for downstream confirm sheet', () => {
      const raw = 'some random string';
      const r = parseTransaction(raw);
      expect(r.raw).toBe(raw);
    });

    it('never throws on garbage input', () => {
      expect(() =>
        parseTransaction('!@#$%^&*()_+-=[]{}|;:",.<>?/~`'),
      ).not.toThrow();
    });
  });
});
