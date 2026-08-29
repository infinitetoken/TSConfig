// The div (not a React Native primitive) only type-checks because lib: DOM
// pulls in HTMLDivElement — proving jsx: react-jsx and lib: DOM both apply.
export function Fixture() {
  return <div />
}
