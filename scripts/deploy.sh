#!/bin/bash

# ZenithKernel Deployment Script
# Handles version updates, git operations, and publishing in one go

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PACKAGES=(
    "packages/zenith-core"
    "packages/zenith-runtime" 
    "packages/zenith-sdk"
    "packages/ost-compression"
    "packages/zenny"
    "packages/zenith-dcloud"
    "packages/vite-plugin"
)

ROOT_PACKAGE="package.json"
BRANCH="main"
REMOTE="origin"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

show_help() {
    cat << EOF
ZenithKernel Deployment Script

Usage: $0 [OPTIONS] VERSION_TYPE

VERSION_TYPE:
    patch       Increment patch version (0.1.1 -> 0.1.2)
    minor       Increment minor version (0.1.1 -> 0.2.0)
    major       Increment major version (0.1.1 -> 1.0.0)
    custom      Specify custom version (requires --version flag)

OPTIONS:
    -v, --version VERSION   Custom version (required with 'custom' type)
    -m, --message MESSAGE   Custom commit message
    -t, --tag               Create git tag
    -p, --publish           Publish to npm after successful build
    -d, --dry-run           Show what would be done without executing
    -s, --skip-tests        Skip running tests
    -b, --branch BRANCH     Target branch (default: main)
    -h, --help              Show this help

Examples:
    $0 patch                           # Bump patch version
    $0 minor -t -p                     # Bump minor, tag, and publish
    $0 custom -v 1.0.0-beta.1 -m "Beta release"
    $0 patch --dry-run                 # Preview changes
EOF
}

get_current_version() {
    local package_file="$1"
    grep '"version"' "$package_file" | sed 's/.*"version": *"\([^"]*\)".*/\1/'
}

increment_version() {
    local version="$1"
    local type="$2"
    
    local major minor patch
    IFS='.' read -r major minor patch <<< "$version"
    
    case "$type" in
        "patch")
            patch=$((patch + 1))
            ;;
        "minor")
            minor=$((minor + 1))
            patch=0
            ;;
        "major")
            major=$((major + 1))
            minor=0
            patch=0
            ;;
        *)
            log_error "Invalid version type: $type"
            exit 1
            ;;
    esac
    
    echo "$major.$minor.$patch"
}

update_package_version() {
    local package_file="$1"
    local new_version="$2"
    local dry_run="$3"
    
    if [[ "$dry_run" == "true" ]]; then
        log_info "Would update $package_file to version $new_version"
        return
    fi
    
    # Use sed to update version in package.json
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/\"version\": *\"[^\"]*\"/\"version\": \"$new_version\"/" "$package_file"
    else
        # Linux
        sed -i "s/\"version\": *\"[^\"]*\"/\"version\": \"$new_version\"/" "$package_file"
    fi
    
    log_success "Updated $package_file to version $new_version"
}

run_tests() {
    local dry_run="$1"
    
    if [[ "$dry_run" == "true" ]]; then
        log_info "Would run tests"
        return
    fi
    
    log_info "Running tests..."
    if ! bun run test; then
        log_error "Tests failed!"
        exit 1
    fi
    log_success "All tests passed"
}

run_typecheck() {
    local dry_run="$1"
    
    if [[ "$dry_run" == "true" ]]; then
        log_info "Would run typecheck"
        return
    fi
    
    log_info "Running typecheck..."
    if ! bun run typecheck; then
        log_error "Typecheck failed!"
        exit 1
    fi
    log_success "Typecheck passed"
}

build_packages() {
    local dry_run="$1"
    
    if [[ "$dry_run" == "true" ]]; then
        log_info "Would build packages"
        return
    fi
    
    log_info "Building packages..."
    for package in "${PACKAGES[@]}"; do
        if [[ -f "$package/package.json" ]]; then
            log_info "Building $package..."
            cd "$package"
            if [[ -f "tsconfig.json" ]] && grep -q '"build"' package.json; then
                bun run build || {
                    log_error "Build failed for $package"
                    exit 1
                }
            fi
            cd - > /dev/null
        fi
    done
    log_success "All packages built successfully"
}

commit_changes() {
    local version="$1"
    local message="$2"
    local dry_run="$3"
    
    if [[ "$dry_run" == "true" ]]; then
        log_info "Would commit changes with message: $message"
        return
    fi
    
    log_info "Committing changes..."
    git add .
    git commit -m "$message"
    log_success "Changes committed"
}

create_tag() {
    local version="$1"
    local dry_run="$2"
    
    if [[ "$dry_run" == "true" ]]; then
        log_info "Would create tag: v$version"
        return
    fi
    
    log_info "Creating tag v$version..."
    git tag "v$version"
    log_success "Tag v$version created"
}

push_changes() {
    local branch="$1"
    local push_tags="$2"
    local dry_run="$3"
    
    if [[ "$dry_run" == "true" ]]; then
        log_info "Would push to $REMOTE/$branch"
        if [[ "$push_tags" == "true" ]]; then
            log_info "Would push tags"
        fi
        return
    fi
    
    log_info "Pushing to $REMOTE/$branch..."
    git push "$REMOTE" "$branch"
    
    if [[ "$push_tags" == "true" ]]; then
        log_info "Pushing tags..."
        git push "$REMOTE" --tags
    fi
    
    log_success "Changes pushed successfully"
}

publish_packages() {
    local dry_run="$1"
    
    if [[ "$dry_run" == "true" ]]; then
        log_info "Would publish packages to npm"
        return
    fi
    
    log_info "Publishing packages to npm..."
    if ! bun run publish:all; then
        log_error "Publishing failed!"
        exit 1
    fi
    log_success "All packages published successfully"
}

# Main script logic starts here
main() {
    local version_type=""
    local custom_version=""
    local commit_message=""
    local create_git_tag=false
    local publish=false
    local dry_run=false
    local skip_tests=false
    local target_branch="$BRANCH"
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -v|--version)
                custom_version="$2"
                shift 2
                ;;
            -m|--message)
                commit_message="$2"
                shift 2
                ;;
            -t|--tag)
                create_git_tag=true
                shift
                ;;
            -p|--publish)
                publish=true
                shift
                ;;
            -d|--dry-run)
                dry_run=true
                shift
                ;;
            -s|--skip-tests)
                skip_tests=true
                shift
                ;;
            -b|--branch)
                target_branch="$2"
                shift 2
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            patch|minor|major|custom)
                version_type="$1"
                shift
                ;;
            *)
                log_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    # Validate arguments
    if [[ -z "$version_type" ]]; then
        log_error "Version type is required"
        show_help
        exit 1
    fi
    
    if [[ "$version_type" == "custom" && -z "$custom_version" ]]; then
        log_error "Custom version is required when using 'custom' type"
        show_help
        exit 1
    fi
    
    # Get current version from root package.json
    current_version=$(get_current_version "$ROOT_PACKAGE")
    log_info "Current version: $current_version"
    
    # Calculate new version
    if [[ "$version_type" == "custom" ]]; then
        new_version="$custom_version"
    else
        new_version=$(increment_version "$current_version" "$version_type")
    fi
    
    log_info "New version: $new_version"
    
    # Set default commit message if not provided
    if [[ -z "$commit_message" ]]; then
        commit_message="chore: bump version to $new_version"
    fi
    
    # Show summary
    echo
    log_info "=== Deployment Summary ==="
    log_info "Version type: $version_type"
    log_info "Current version: $current_version"
    log_info "New version: $new_version"
    log_info "Commit message: $commit_message"
    log_info "Create tag: $create_git_tag"
    log_info "Publish: $publish"
    log_info "Dry run: $dry_run"
    log_info "Skip tests: $skip_tests"
    log_info "Target branch: $target_branch"
    echo
    
    if [[ "$dry_run" == "false" ]]; then
        read -p "Continue with deployment? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "Deployment cancelled"
            exit 0
        fi
    fi
    
    # Execute deployment steps
    log_info "Starting deployment process..."
    
    # Update versions in all packages
    log_info "Updating package versions..."
    update_package_version "$ROOT_PACKAGE" "$new_version" "$dry_run"
    
    for package in "${PACKAGES[@]}"; do
        if [[ -f "$package/package.json" ]]; then
            update_package_version "$package/package.json" "$new_version" "$dry_run"
        fi
    done
    
    # Run typecheck
    run_typecheck "$dry_run"
    
    # Run tests (unless skipped)
    if [[ "$skip_tests" == "false" ]]; then
        run_tests "$dry_run"
    else
        log_warning "Skipping tests"
    fi
    
    # Build packages
    build_packages "$dry_run"
    
    # Git operations
    commit_changes "$new_version" "$commit_message" "$dry_run"
    
    if [[ "$create_git_tag" == "true" ]]; then
        create_tag "$new_version" "$dry_run"
    fi
    
    push_changes "$target_branch" "$create_git_tag" "$dry_run"
    
    # Publish packages
    if [[ "$publish" == "true" ]]; then
        publish_packages "$dry_run"
    fi
    
    log_success "Deployment completed successfully!"
    log_info "Version $new_version is now deployed"
}

# Check if we're in the right directory
if [[ ! -f "package.json" ]] || [[ ! -d "packages" ]]; then
    log_error "This script must be run from the ZenithKernel root directory"
    exit 1
fi

# Check if git is clean (unless dry run)
if [[ "$*" != *"--dry-run"* ]] && [[ -n "$(git status --porcelain)" ]]; then
    log_error "Git working directory is not clean. Please commit or stash changes first."
    exit 1
fi

# Run main function
main "$@"
