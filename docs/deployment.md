# ZenithKernel Deployment & CI/CD Guide

This guide covers the deployment process, CI/CD pipelines, and version management for the ZenithKernel project.

## Quick Start

### Local Version Management

```bash
# Show current versions
./scripts/version.sh show

# Bump patch version (0.1.1 → 0.1.2)
./scripts/version.sh bump patch

# Bump minor version (0.1.1 → 0.2.0)
./scripts/version.sh bump minor

# Set specific version
./scripts/version.sh set 1.0.0-beta.1

# Sync all packages to root version
./scripts/version.sh sync

# Check version consistency
./scripts/version.sh check
```

### Full Deployment

```bash
# Patch release with tag and publish
./scripts/deploy.sh patch --tag --publish

# Minor release with custom message
./scripts/deploy.sh minor --tag --publish --message "feat: new features added"

# Custom version release
./scripts/deploy.sh custom --version 1.0.0-rc.1 --tag --publish

# Dry run to preview changes
./scripts/deploy.sh patch --tag --publish --dry-run
```

## Scripts Overview

### `scripts/version.sh`
Local version management without git operations or publishing.

**Commands:**
- `show` - Display current versions of all packages
- `bump [patch|minor|major]` - Increment version numbers
- `set VERSION` - Set specific version across all packages
- `sync` - Sync all package versions to root version
- `check` - Verify version consistency

### `scripts/deploy.sh`
Complete deployment pipeline with git operations and publishing.

**Features:**
- Version bumping (patch/minor/major/custom)
- TypeScript compilation and testing
- Git commit, tag, and push
- NPM publishing
- Dry-run mode for testing

**Options:**
- `-v, --version VERSION` - Custom version (for custom type)
- `-m, --message MESSAGE` - Custom commit message
- `-t, --tag` - Create git tag
- `-p, --publish` - Publish to npm
- `-d, --dry-run` - Preview changes only
- `-s, --skip-tests` - Skip test execution
- `-b, --branch BRANCH` - Target branch (default: main)

## CI/CD Pipelines

### GitHub Actions Workflows

#### 1. **CI Pipeline** (`.github/workflows/ci.yml`)
Runs on every push and PR to main/develop branches.

**Jobs:**
- **Test & Lint** - TypeScript checking, linting, unit tests
- **Build** - Package compilation and artifact generation
- **Security** - Dependency audit and CodeQL analysis
- **Publish** - NPM publishing (release events only)
- **Deploy Demo** - GitHub Pages deployment (main branch)
- **Notify** - Discord notifications

#### 2. **Release Workflow** (`.github/workflows/release.yml`)
Manual workflow for creating releases.

**Inputs:**
- Version type (patch/minor/major/custom)
- Custom version (if type is custom)
- Release notes
- Prerelease flag

**Process:**
1. Version bump across all packages
2. Run tests and build
3. Create git tag and commit
4. Publish to NPM
5. Create GitHub release
6. Upload release assets

#### 3. **PR Workflow** (`.github/workflows/pr.yml`)
Enhanced PR validation and testing.

**Features:**
- Change detection (packages/docs/CI)
- Multi-version testing (Bun latest + 1.0.0)
- Bundle size analysis
- Documentation checks
- Auto-merge for Dependabot PRs
- PR status comments

### Required Secrets

Set these in your GitHub repository settings:

```bash
# NPM publishing
NPM_TOKEN=your_npm_token

# Code coverage
CODECOV_TOKEN=your_codecov_token

# Discord notifications (optional)
DISCORD_WEBHOOK=your_discord_webhook_url
```

## Version Management Strategy

### Semantic Versioning
We follow [Semantic Versioning](https://semver.org/):

- **MAJOR** (1.0.0) - Breaking changes
- **MINOR** (0.1.0) - New features, backward compatible
- **PATCH** (0.0.1) - Bug fixes, backward compatible

### Pre-release Versions
- **Alpha** (1.0.0-alpha.1) - Early development
- **Beta** (1.0.0-beta.1) - Feature complete, testing
- **RC** (1.0.0-rc.1) - Release candidate

### Package Synchronization
All packages maintain the same version number for consistency:
- `@zenithcore/core`
- `@zenithcore/runtime`
- `@zenithcore/sdk`
- `@zenithcore/ost-compression`
- `@zenithcore/zenny`
- `@zenithcore/zenith-dcloud`

## Publishing Process

### Automated (Recommended)
1. Use GitHub Actions release workflow
2. Select version type and provide release notes
3. Workflow handles everything automatically

### Manual
1. Update versions: `./scripts/version.sh bump patch`
2. Run tests: `bun run test`
3. Build packages: `bun run build`
4. Commit changes: `git commit -am "chore: bump version"`
5. Create tag: `git tag v0.1.2`
6. Push: `git push origin main --tags`
7. Publish: `bun run publish:all`

## Environment Setup

### Local Development
```bash
# Install dependencies
bun install

# Run tests
bun run test

# Type checking
bun run typecheck

# Build packages
bun run build

# Start demo app
bun run demo
```

### CI Environment
The CI uses:
- **Bun** latest and 1.0.0 for compatibility testing
- **Node.js** 20 for npm publishing
- **Ubuntu** latest for all jobs

## Troubleshooting

### Common Issues

**Version Inconsistencies**
```bash
# Check versions
./scripts/version.sh check

# Fix inconsistencies
./scripts/version.sh sync
```

**Failed Tests**
```bash
# Run tests locally
bun run test

# Run specific package tests
cd packages/zenith-core && bun run test
```

**Build Failures**
```bash
# Clean and rebuild
bun run clean
bun install
bun run build
```

**Publishing Issues**
```bash
# Check npm authentication
npm whoami

# Dry run publish
bun run publish:dry

# Manual package publish
cd packages/zenith-core && npm publish --access public
```

### Debug Mode
Enable debug output in scripts:
```bash
# Set debug mode
export DEBUG=1

# Run with verbose output
./scripts/deploy.sh patch --dry-run
```

## Best Practices

1. **Always test before releasing**
   - Run full test suite
   - Check TypeScript compilation
   - Verify package builds

2. **Use semantic versioning**
   - Breaking changes = major bump
   - New features = minor bump
   - Bug fixes = patch bump

3. **Write meaningful commit messages**
   - Follow conventional commits
   - Include scope when relevant
   - Reference issues/PRs

4. **Review changes before publishing**
   - Use dry-run mode first
   - Check generated changelogs
   - Verify version numbers

5. **Monitor CI/CD pipelines**
   - Check GitHub Actions status
   - Review test coverage reports
   - Monitor npm download stats

## Support

For issues with deployment or CI/CD:
1. Check GitHub Actions logs
2. Review this documentation
3. Open an issue with deployment logs
4. Contact the maintainers

---

**Next Steps:**
- Set up required GitHub secrets
- Test the deployment scripts
- Configure Discord notifications (optional)
- Review and customize workflows as needed
