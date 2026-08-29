import data from './fixture.json'

export const fixture: number = data.value

// Only compiles under the server preset's relaxed noImplicitReturns — the
// base/node presets require every code path to return a value.
export function maybeReturn(flag: boolean): number | undefined {
  if (flag) {
    return 1
  }
}
