# @infinitetoken/tsconfig

Shared base `tsconfig.json` for InfiniteToken TypeScript packages. Holds the compiler flags every repo agrees on (strictness, declaration output, consistent casing). Build-mechanics options that vary per repo (`target`, `module`, `moduleResolution`, `rootDir`, `types`, `include`/`exclude`) stay local to each consumer.

## Usage

```json
{
  "extends": "@infinitetoken/tsconfig/tsconfig.json",
  "compilerOptions": {
    "target": "esnext",
    "module": "preserve",
    "moduleResolution": "bundler",
    "rootDir": "./src",
    "types": ["jest", "node"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

## Release

Tag-based, using npm trusted publishing (OIDC, no token required):

```bash
npm version patch   # or minor / major
git push --follow-tags
```
