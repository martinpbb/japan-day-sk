import { test, expect } from '@playwright/test';
import { registrationLimits, validateRegistration } from '../../src/lib/registration.js';

test('registration validates required fields after trimming', () => {
  expect(validateRegistration({ firstName: ' ', lastName: '\t', email: '', phone: '\n' }).errors)
    .toEqual({ firstName: 'required', lastName: 'required', email: 'required', phone: 'required' });
});

test('registration accepts international contact details and trims every field', () => {
  for (const phone of ['+421 905 123 456', '+420 777 123 456', '+44 (0)20 7946 0958']) {
    const result = validateRegistration({ firstName: ' Anna ', lastName: ' Nováková ', email: ' anna@example.com ', phone: ` ${phone} ` });
    expect(result.errors).toEqual({});
    expect(result.values).toEqual({ firstName: 'Anna', lastName: 'Nováková', email: 'anna@example.com', phone });
  }
});

test('registration rejects malformed email and excessive lengths', () => {
  const valid = { firstName: 'Anna', lastName: 'Nováková', email: 'anna@example.com', phone: '+420 777 123 456' };
  for (const email of ['anna', 'anna@', 'anna@example', 'anna @example.com']) {
    expect(validateRegistration({ ...valid, email }).errors.email).toBe('emailInvalid');
  }
  for (const [field, max] of Object.entries(registrationLimits)) {
    expect(validateRegistration({ ...valid, [field]: 'a'.repeat(max + 1) }).errors[field]).toBe('tooLong');
  }
});
