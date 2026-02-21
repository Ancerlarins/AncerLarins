import { describe, it, expect } from 'vitest';
import {
  formatPrice,
  formatPriceShort,
  truncate,
  slugify,
  generateWhatsAppLink,
  pluralize,
  cn,
} from '../utils';

describe('formatPrice', () => {
  it('converts kobo to formatted Naira', () => {
    expect(formatPrice(150000000)).toBe('₦1,500,000');
  });

  it('handles zero', () => {
    expect(formatPrice(0)).toBe('₦0');
  });

  it('handles small amounts', () => {
    expect(formatPrice(5000)).toBe('₦50');
  });
});

describe('formatPriceShort', () => {
  it('formats billions', () => {
    expect(formatPriceShort(150000000000)).toBe('₦1.5B');
  });

  it('formats millions', () => {
    expect(formatPriceShort(150000000)).toBe('₦1.5M');
  });

  it('formats thousands', () => {
    expect(formatPriceShort(500000)).toBe('₦5K');
  });

  it('formats small values', () => {
    expect(formatPriceShort(5000)).toBe('₦50');
  });
});

describe('truncate', () => {
  it('truncates text longer than limit', () => {
    expect(truncate('Hello World', 5)).toBe('Hello...');
  });

  it('returns full text if shorter than limit', () => {
    expect(truncate('Hi', 5)).toBe('Hi');
  });

  it('returns full text if equal to limit', () => {
    expect(truncate('Hello', 5)).toBe('Hello');
  });
});

describe('slugify', () => {
  it('converts to lowercase kebab-case', () => {
    expect(slugify('Lekki Phase 1')).toBe('lekki-phase-1');
  });

  it('removes special characters', () => {
    expect(slugify('Hello, World!')).toBe('hello-world');
  });

  it('trims leading/trailing hyphens', () => {
    expect(slugify('  hello  ')).toBe('hello');
  });
});

describe('generateWhatsAppLink', () => {
  it('generates correct WhatsApp URL', () => {
    const link = generateWhatsAppLink('+2348012345678', 'Hello');
    expect(link).toContain('https://wa.me/+2348012345678');
    expect(link).toContain('text=Hello');
  });

  it('encodes message text', () => {
    const link = generateWhatsAppLink('2348000000000', 'Hi there!');
    expect(link).toContain('text=Hi%20there!');
  });
});

describe('pluralize', () => {
  it('returns singular for count 1', () => {
    expect(pluralize(1, 'bedroom')).toBe('bedroom');
  });

  it('returns auto-plural for count > 1', () => {
    expect(pluralize(3, 'bedroom')).toBe('bedrooms');
  });

  it('returns custom plural', () => {
    expect(pluralize(2, 'property', 'properties')).toBe('properties');
  });

  it('returns auto-plural for count 0', () => {
    expect(pluralize(0, 'bedroom')).toBe('bedrooms');
  });
});

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('filters falsy values', () => {
    expect(cn('foo', null, undefined, false, 'bar')).toBe('foo bar');
  });
});
