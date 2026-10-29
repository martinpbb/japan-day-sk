# PAY by square verification

Task: verify the existing isolated module; no registration integration or deployment.
Branch: `main`; starting HEAD: `c55ec4d32387c97ae766be99df1bb481b5a8357c`.

## Results

- IMPLEMENTED: three verification tests added; original five tests preserved.
  `pay-by-square.js` was not changed. Added exact development dependencies
  `bysquare@4.1.0` and `jsqr@1.4.0` (pure JavaScript, no native binaries).
- VERIFIED: separate `bysquare/pay` decoder (xseman/bysquare), using its own
  base32hex, LZMA and CRC32 validation, decoded the wrapper output successfully.
  Checked beneficiary `Japan Day`, synthetic checksum-valid IBAN
  `SK7700000000000000000000` (zero bank/account), amount `12.50`, currency `EUR`,
  variable symbol `123456`, and message `JAPAN DAY WORKSHOP`. Unicode beneficiary
  and message also roundtripped. No private account used for new verification.
- VERIFIED: actual SVG strokes rasterized in the test and decoded with jsQR;
  recovered QR text equals the generated payload exactly. Rasterizer deliberately
  supports the existing qrcode SVG dialect and fails on unexpected commands.
- VERIFIED: Wrangler 4.45.0 dry-run with existing `worker/wrangler.toml`, both
  normal entrypoint (7.66 KiB / gzip 2.51 KiB) and isolated module entrypoint
  (81.05 KiB / gzip 18.31 KiB). Bundle metadata includes `@paybysquare/core`
  encoder and `qrcode/lib/browser.js` plus SVG renderer. No Node compatibility
  flags or config changes required.

Commands, from the repository root, with repository-local logs:

```powershell
$env:WRANGLER_LOG_PATH="$PWD/.wrangler/logs"
$env:WRANGLER_SEND_METRICS='false'
npx.cmd --no-install wrangler deploy --dry-run --config worker/wrangler.toml --outdir .wrangler/pay-square-baseline
npx.cmd --no-install wrangler deploy worker/src/pay-by-square-bundle.local.js --dry-run --config worker/wrangler.toml --outdir .wrangler/pay-square-bundle --metafile .wrangler/pay-square-metafile.json
```

The temporary isolated entrypoint imported both wrapper functions and called
them inside `fetch`, returning the test payment's SVG in a Response. It was
removed after verification. Generated bundle `fetch()` also passed a Node smoke
check: HTTP 200, 3444 SVG characters. This is not a Cloudflare runtime test.

The initial restricted dry-run failed before import resolution:
`Cannot read directory "../../../..": Access is denied.` and
`Could not resolve "C:\Users\Martin\Documents\repo\japan-day-sk\worker\src\worker.js"`.
The directory diagnostic supplied only that relative path. Both dry-runs then
passed with broader filesystem access. This was an environment restriction.
PowerShell blocks `npx.ps1`; using `npx.cmd` avoids that separate restriction.

## Package inspection and validation

Installed `@paybysquare/core@0.1.0` exports `generatePayload`, `buildDataString`
and `ValidationError`, with no decoder/verifier. Its README links shared
[vectors](https://github.com/usmansher/paybysquare/blob/main/spec/test-vectors.json)
and describes independent liblzma verification. The published package excludes
those fixtures. Our tests use the separate decoder instead of trusting that claim.
Independent decoder source: https://github.com/xseman/bysquare.

- TESTED: `node --test worker/src/pay-by-square.test.js`: 8 passed, 0 failed/skipped.
- TESTED: `npx.cmd --no-install eslint worker/src/pay-by-square.js worker/src/pay-by-square.test.js`: passed.
- TESTED: `git diff --check`: passed before this note; repeated at completion.
- VERIFIED: `graphify update .` completed; local graph artifacts are ignored.
- NOT RUN: full Playwright, frontend build, deployment, banking-app scan or live payment.
- `npm audit` reports 20 repository advisories (2 low, 2 moderate, 16 high).
  None are reported against the encoder, qrcode, or added verification packages
  and their transitive dependencies. No unrelated dependency upgrades performed.

## Readiness and remaining limits

Ready for a separately authorized integration task on the verified encoding,
QR and Worker bundling criteria. No concrete incompatibility found. Real banking
app acceptance and deployed Worker execution remain unverified. The encoder
defaults the payment due date to current UTC day; output is repeatable within
that date, not permanently stable across days. Integration must decide date
semantics. Bank/account existence is intentionally not checked by a checksum.

Files changed this task: `worker/src/pay-by-square.test.js`, `package.json`,
`package-lock.json`, this note. Package manifests and both module files were
already dirty/untracked at task start; prior implementation work was preserved.

Next action: stop; await a separate integration task.
