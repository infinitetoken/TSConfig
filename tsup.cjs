const { defineConfig } = require('tsup')

const BASE_DEFAULTS = {
  format: ['cjs', 'esm'],
  dts: true
}

const CLI_DEFAULTS = {
  format: ['esm'],
  banner: { js: '#!/usr/bin/env node' }
}

/**
 * A single tsup build-entry object, for composing a multi-entry array yourself
 * (e.g. a library entry plus a separate subpath entry). `clean` is deliberately
 * NOT defaulted here — with multiple entries in one array, only the first should
 * clean `dist/`, or later entries wipe out earlier ones' output.
 *
 * @param {string|string[]} entry
 * @param {import('tsup').Options} [overrides]
 * @returns {import('tsup').Options}
 */
function entryConfig(entry, overrides = {}) {
  return {
    entry: Array.isArray(entry) ? entry : [entry],
    ...BASE_DEFAULTS,
    ...overrides
  }
}

/**
 * A CLI bin entry: ESM-only with a Node shebang banner, no declarations.
 *
 * @param {string|string[]} entry
 * @param {import('tsup').Options} [overrides]
 * @returns {import('tsup').Options}
 */
function cliConfig(entry, overrides = {}) {
  return {
    entry: Array.isArray(entry) ? entry : [entry],
    ...CLI_DEFAULTS,
    ...overrides
  }
}

/**
 * The common case: one library entry point, cjs+esm, with declarations and a
 * clean build. Covers most packages in the fleet outright.
 *
 * For a package with multiple entries (e.g. a CLI bin alongside the library),
 * skip this and compose `entryConfig`/`cliConfig` yourself under `defineConfig([...])`.
 *
 * @param {string|string[]} [entry]
 * @param {import('tsup').Options} [overrides]
 * @returns {import('tsup').Options}
 */
function createTsupConfig(entry = 'src/index.ts', overrides = {}) {
  return defineConfig(entryConfig(entry, { clean: true, ...overrides }))
}

module.exports = { createTsupConfig, entryConfig, cliConfig, defineConfig }
