export const registrationLimits = { firstName: 100, lastName: 100, email: 254, phone: 50 };

// Local UI validation only. No transport or persistence belongs here.
export function validateRegistration(values) {
  const trimmed = {};
  const errors = {};
  for (const [field, max] of Object.entries(registrationLimits)) {
    trimmed[field] = String(values[field] ?? "").trim();
    if (!trimmed[field]) errors[field] = "required";
    else if (trimmed[field].length > max) errors[field] = "tooLong";
  }
  if (!errors.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed.email)) {
    errors.email = "emailInvalid";
  }
  return { values: trimmed, errors };
}
