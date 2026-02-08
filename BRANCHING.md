# Branching Strategy

This repo uses a **production-first** branching model suitable for scalable deployment.

## Branches

| Branch    | Purpose |
|-----------|--------|
| **main**  | Production. Always deployable. Protected; changes via PR from `develop` or release branches. |
| **develop** | Integration / staging. Feature branches merge here; when stable, merge to `main` for release. |

## Workflow

1. **Feature work**: Branch from `develop` (e.g. `feature/search-filters`, `fix/auth-expiry`).
2. **Merge to develop**: Open a PR into `develop`; run tests and review.
3. **Release to production**: When `develop` is ready, open a PR from `develop` → `main`. Tag releases on `main` (e.g. `v1.0.0`).
4. **Hotfixes**: Branch from `main` (e.g. `hotfix/critical-fix`), fix, PR to `main`, then merge back into `develop`.

## Conventions

- **Commits**: Use conventional commits when possible (`feat:`, `fix:`, `chore:`, `docs:`).
- **Tags**: Use semantic versioning on `main` for releases (`v1.0.0`).
- **CI/CD**: Run tests and lint on PRs; deploy `main` to production (see `DEVOPS_SCRIPTS.md`).

## Quick reference

```bash
# Start a feature
git checkout develop && git pull
git checkout -b feature/your-feature

# After merge to develop, release to production
git checkout main && git pull
git merge develop
git push origin main
git tag v1.0.0 && git push --tags
```
