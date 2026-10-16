# TODO

## Drop the React Native 0.88 legacy-types condition before Expo SDK 59

Added 2026-10-16 to ship the first Expo SDK 58 apps the same day. `src/react-native.json` sets `customConditions: ["react-native", "react-native-legacy-deep-imports"]`; the second condition makes React Native 0.88 resolve its old `types_DEPRECATED` declarations instead of the new strict ones. React Native removes those after 0.88, so before any app moves past SDK 58:

1. Move every consumer to the strict types. Measured in Solitaire on SDK 58 with strict types (2026-10-16): 116 errors, 76 in the app and about 40 in package source it type-checks (`@tastic/hud` 15, `@tastic/split-screen` 6, `@tastic/cards` 6, `@rific/auto-paper` 6, `@tastic/profile` 3, `@tastic/core` 2, `@rific/updater` 1, `@rific/feedback-press` 1), nearly all refs (`RefObject<View>` to `ViewInstance` and friends). Fix packages top-down and release them first, then the apps. Each affected repo has its own TODO entry.
2. Remove the condition here (back to `["react-native"]`), drop the README section, and release a minor.
