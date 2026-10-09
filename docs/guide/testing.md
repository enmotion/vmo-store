# Testing

## Local verification

Use Node.js 24 (recommended), or a supported Node.js 20.19+/22.12+ release, then:

```sh
npm ci
npx playwright install chromium firefox webkit
npm run verify
```

`verify` runs coverage, library build, package checks, documentation build and real browser tests. Linux machines may require `npx playwright install --with-deps`.

## Coverage contract

`npm run coverage` requires **100% statements, branches, functions and lines for every production file**. Coverage includes `index.ts` and all `use.lib/**/*.ts`; examples, docs, build tooling and type declarations are separate verification targets. No production branches are excluded to obtain the result.

The current unit suite covers persistence/reloading, malformed payload isolation, namespace cleanup, expiry boundaries, capacity/write failures, complex values, Unicode obfuscation and legacy formats. Coverage is a measurement of executed paths, not a proof that no defect exists.

## Real browser matrix

`npm run test:e2e` tests Chromium, Firefox and WebKit, plus mobile Chromium and mobile WebKit viewports. Browser tests use built bundles, actual Web Storage, page reloads and independent tabs/contexts. Mobile projects emulate viewport/device behavior; they are not physical-device tests.

Docs checks verify both languages, navigation, local search, deep links under `/vmo-store/`, responsive overflow and the live playground. Reports and traces are saved under `test/reports/browser/`.

```sh
npm run test:e2e:headed  # visible browsers
npm run test:e2e:report  # open the HTML report
```

## Package checks

`npm run test:package` verifies ESM and CJS imports, complex value round-tripping, and strict NodeNext declaration resolution for both module formats.

CI executes the same verification steps before a trusted `master` push is allowed to deploy documentation.
