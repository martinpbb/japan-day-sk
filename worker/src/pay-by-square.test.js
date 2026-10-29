import test from 'node:test';
import assert from 'node:assert/strict';
import { decode } from 'bysquare/pay';
import jsQR from 'jsqr';
import { createPayBySquarePayload, isValidIban, normalizeIban, renderPayBySquareQrSvg } from './pay-by-square.js';

const payment = {
  iban: 'SK72 8330 0000 0091 1111 1118',
  amount: 24.5,
  beneficiaryName: 'Workshop',
  variableSymbol: '1234567890',
};

test('normalizes and validates a Slovak IBAN checksum', () => {
  assert.equal(normalizeIban(payment.iban), 'SK7283300000009111111118');
  assert.equal(isValidIban(payment.iban), true);
  assert.equal(isValidIban('SK7283300000009111111119'), false);
});

test('accepts integer and decimal EUR, rejects excess precision', () => {
  assert.ok(createPayBySquarePayload({ ...payment, amount: 24 }));
  assert.ok(createPayBySquarePayload(payment));
  assert.throws(() => createPayBySquarePayload({ ...payment, amount: 24.501 }), /2 decimal/);
});

test('validates required beneficiary and variable symbol length', () => {
  assert.throws(() => createPayBySquarePayload({ ...payment, beneficiaryName: ' ' }), /beneficiaryName/);
  assert.throws(() => createPayBySquarePayload({ ...payment, variableSymbol: '12345678901' }), /variableSymbol/);
  assert.throws(() => createPayBySquarePayload({ ...payment, variableSymbol: '123a' }), /variableSymbol/);
});

test('returns deterministic PAY by square payload, not SPD', () => {
  const first = createPayBySquarePayload(payment);
  assert.equal(createPayBySquarePayload(payment), first);
  assert.equal(first.startsWith('SPD*1.0'), false);
  assert.match(first, /^[0-9A-V]+$/);
});

test('renders a non-empty SVG QR code', async () => {
  const svg = await renderPayBySquareQrSvg(createPayBySquarePayload(payment));
  assert.match(svg, /<svg\b/);
  assert.ok(svg.length > 0);
});

// Synthetic checksum-valid Slovak IBAN: zero bank/account, never a real payee.
const compatibilityPayment = {
  beneficiaryName: 'Japan Day',
  iban: 'SK7700000000000000000000',
  amount: 12.50,
  currency: 'EUR',
  variableSymbol: '123456',
  message: 'JAPAN DAY WORKSHOP',
};

test('independent bysquare decoder recovers all payment fields and validates CRC32', () => {
  assert.equal(isValidIban(compatibilityPayment.iban), true);
  const { payments } = decode(createPayBySquarePayload(compatibilityPayment));
  assert.equal(payments.length, 1);
  const [decoded] = payments;
  assert.equal(decoded.type, 1);
  assert.equal(decoded.beneficiary.name, compatibilityPayment.beneficiaryName);
  assert.deepEqual(decoded.bankAccounts, [{ iban: compatibilityPayment.iban, bic: undefined }]);
  assert.equal(decoded.amount, compatibilityPayment.amount);
  assert.equal(decoded.currencyCode, compatibilityPayment.currency);
  assert.equal(decoded.variableSymbol, compatibilityPayment.variableSymbol);
  assert.equal(decoded.paymentNote, compatibilityPayment.message);
});

test('independent decoder preserves Unicode beneficiary and message', () => {
  const input = { ...compatibilityPayment, beneficiaryName: 'Japonský deň', message: 'Čaj a kultúra' };
  const [decoded] = decode(createPayBySquarePayload(input)).payments;
  assert.equal(decoded.beneficiary.name, input.beneficiaryName);
  assert.equal(decoded.paymentNote, input.message);
});

// Rasterize only qrcode's SVG horizontal-stroke dialect. Read the actual SVG,
// never QRCode.create(), so the independent decoder checks the rendered output.
function rasterizeQrSvg(svg) {
  const [, sizeText] = svg.match(/viewBox="0 0 (\d+) \d+"/);
  const [, path] = svg.match(/<path stroke="#000000" d="([^"]+)"/);
  const scale = 4;
  const width = Number(sizeText) * scale;
  const pixels = new Uint8ClampedArray(width * width * 4).fill(255);
  const commands = [...path.matchAll(/([Mmh])([\d.]+)(?: ([\d.]+))?/g)];
  assert.equal(commands.map(([command]) => command).join(''), path, 'unsupported SVG path');
  let x = 0;
  let y = 0;
  for (const [, command, a, b] of commands) {
    if (command === 'M') { x = Number(a); y = Number(b); }
    else if (command === 'm') { x += Number(a); y += Number(b); }
    else {
      for (let row = (y - 0.5) * scale; row < (y + 0.5) * scale; row++) {
        for (let col = x * scale; col < (x + Number(a)) * scale; col++) {
          const offset = (row * width + col) * 4;
          pixels.fill(0, offset, offset + 3);
        }
      }
      x += Number(a);
    }
  }
  return { pixels, width };
}

test('SVG QR roundtrip through independent jsQR returns the exact payload', async () => {
  const payload = createPayBySquarePayload(compatibilityPayment);
  const { pixels, width } = rasterizeQrSvg(await renderPayBySquareQrSvg(payload));
  const decoded = jsQR(pixels, width, width);
  assert.ok(decoded, 'SVG QR must be readable');
  assert.equal(decoded.data, payload);
});
