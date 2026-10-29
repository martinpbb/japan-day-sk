import { generatePayload } from '@paybysquare/core';
import QRCode from 'qrcode';

export function normalizeIban(value) {
  if (typeof value !== 'string') return '';
  return value.replace(/\s/g, '').toUpperCase();
}

export function isValidIban(value) {
  const iban = normalizeIban(value);
  if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/.test(iban)) return false;
  if (iban.startsWith('SK') && iban.length !== 24) return false;
  const rearranged = iban.slice(4) + iban.slice(0, 4);
  let remainder = 0;
  for (const char of rearranged) {
    const digits = char >= 'A' && char <= 'Z' ? String(char.charCodeAt(0) - 55) : char;
    for (const digit of digits) remainder = (remainder * 10 + Number(digit)) % 97;
  }
  return remainder === 1;
}

export function createPayBySquarePayload(input) {
  if (!input || typeof input !== 'object') throw new TypeError('input is required');
  const iban = normalizeIban(input.iban);
  if (!iban) throw new TypeError('iban is required');
  if (!isValidIban(iban)) throw new TypeError('iban is invalid');
  if (typeof input.beneficiaryName !== 'string' || !input.beneficiaryName.trim()) {
    throw new TypeError('beneficiaryName is required');
  }
  if (typeof input.amount !== 'number' || !Number.isFinite(input.amount) || input.amount <= 0) {
    throw new TypeError('amount must be a positive number');
  }
  if (Math.abs(input.amount * 100 - Math.round(input.amount * 100)) > 1e-6) {
    throw new TypeError('amount must have at most 2 decimal places');
  }
  const variableSymbol = input.variableSymbol ?? '';
  if (typeof variableSymbol !== 'string' || (variableSymbol && !/^\d{1,10}$/.test(variableSymbol))) {
    throw new TypeError('variableSymbol must be up to 10 digits');
  }
  const message = input.message ?? '';
  if (typeof message !== 'string' || message.length > 140) {
    throw new TypeError('message must be at most 140 characters');
  }
  return generatePayload({
    iban,
    swift: input.bic,
    amount: input.amount,
    currency: input.currency ?? 'EUR',
    variableSymbol,
    note: message,
    beneficiaryName: input.beneficiaryName,
  });
}

export async function renderPayBySquareQrSvg(payload) {
  if (typeof payload !== 'string' || !payload) throw new TypeError('payload is required');
  return QRCode.toString(payload, {
    type: 'svg',
    errorCorrectionLevel: 'M',
    margin: 4,
    width: 320,
  });
}
