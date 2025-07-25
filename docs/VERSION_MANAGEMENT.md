# Version Management

The Smart-ilo4 project uses an automated version management system that tracks changes based on git commit messages and updates version numbers accordingly.

## Version File Structure

- `VERSION.json` - Contains current version, build date, and changelog
- `package.json` (backend) - Backend package version
- `frontend/package.json` - Frontend package version

## Automatic Version Bumping

The system analyzes recent git commits to determine the appropriate version bump:

### Version Bump Rules

- **Major version** (X.0.0): Breaking changes, commits with "breaking", "major:", or "!:"
- **Minor version** (X.Y.0): New features, commits starting with "feat:", "feature:", or containing "add", "implement", "enhance"
- **Patch version** (X.Y.Z): Bug fixes, refactoring, chores, documentation updates

### Usage

```bash
# Automatic version bump based on commit analysis
npm run version:auto

# Manual version bumps
npm run version:patch    # 1.1.0 → 1.1.1
npm run version:minor    # 1.1.0 → 1.2.0
npm run version:major    # 1.1.0 → 2.0.0
```

## Version Display

The current version is automatically displayed in:

- **Login Page Footer**: Shows "Version X.X.X"
- **Dashboard Footer**: Shows "Version X.X.X"

## Commit Message Best Practices

To ensure proper version bumping, use conventional commit formats:

```bash
feat: add new temperature sensor support          # Minor bump
fix: resolve fan control timeout issues           # Patch bump
docs: update API documentation                    # Patch bump
refactor: improve code structure                  # Patch bump
feat!: breaking change to API endpoints           # Major bump
```

## Manual Version Update

If you need to manually update the version:

1. Edit `VERSION.json` with new version and changelog entry
2. Update both `package.json` files with the new version
3. Commit the changes

The version utility will automatically sync all version files when run.
