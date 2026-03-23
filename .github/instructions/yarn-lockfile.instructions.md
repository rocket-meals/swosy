---
applyTo: "**"
---

# Yarn Lockfile

After adding or modifying packages (e.g. adding a new dependency, updating a version in `package.json`), the lockfile must be regenerated:

```bash
yarn install --no-immutable
```

The CI pipeline runs `yarn install --immutable`, which fails if the lockfile is out of date.
Never commit changes to `package.json` without also committing the updated `yarn.lock`.
