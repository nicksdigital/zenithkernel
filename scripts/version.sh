#!/bin/bash

# ZenithKernel Version Management Script
# Simple script for local version management without publishing

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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
ZenithKernel Version Management

Usage: $0 [COMMAND] [OPTIONS]

COMMANDS:
    show                Show current versions
    bump TYPE           Bump version (patch|minor|major)
    set VERSION         Set specific version
    sync                Sync all package versions to root version
    check               Check version consistency

OPTIONS:
    -h, --help          Show this help

Examples:
    $0 show                    # Show current versions
    $0 bump patch              # Bump patch version
    $0 set 1.0.0-beta.1        # Set specific version
    $0 sync                    # Sync all packages to root version
    $0 check                   # Check version consistency
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

show_versions() {
    log_info "Current package versions:"
    echo
    
    # Show root version
    root_version=$(get_current_version "$ROOT_PACKAGE")
    printf "%-25s %s\n" "Root package:" "$root_version"
    
    # Show package versions
    for package in "${PACKAGES[@]}"; do
        if [[ -f "$package/package.json" ]]; then
            package_name=$(basename "$package")
            version=$(get_current_version "$package/package.json")
            printf "%-25s %s\n" "$package_name:" "$version"
        fi
    done
    echo
}

bump_version() {
    local type="$1"
    
    if [[ ! "$type" =~ ^(patch|minor|major)$ ]]; then
        log_error "Invalid version type. Use: patch, minor, or major"
        exit 1
    fi
    
    # Get current root version
    current_version=$(get_current_version "$ROOT_PACKAGE")
    new_version=$(increment_version "$current_version" "$type")
    
    log_info "Bumping $type version: $current_version → $new_version"
    
    # Update root package
    update_package_version "$ROOT_PACKAGE" "$new_version"
    
    # Update all packages
    for package in "${PACKAGES[@]}"; do
        if [[ -f "$package/package.json" ]]; then
            update_package_version "$package/package.json" "$new_version"
        fi
    done
    
    log_success "All packages updated to version $new_version"
}

set_version() {
    local new_version="$1"
    
    if [[ -z "$new_version" ]]; then
        log_error "Version is required"
        exit 1
    fi
    
    # Validate version format (basic check)
    if [[ ! "$new_version" =~ ^[0-9]+\.[0-9]+\.[0-9]+(-.*)?$ ]]; then
        log_warning "Version format may be invalid: $new_version"
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "Operation cancelled"
            exit 0
        fi
    fi
    
    log_info "Setting version to: $new_version"
    
    # Update root package
    update_package_version "$ROOT_PACKAGE" "$new_version"
    
    # Update all packages
    for package in "${PACKAGES[@]}"; do
        if [[ -f "$package/package.json" ]]; then
            update_package_version "$package/package.json" "$new_version"
        fi
    done
    
    log_success "All packages updated to version $new_version"
}

sync_versions() {
    # Get root version
    root_version=$(get_current_version "$ROOT_PACKAGE")
    
    log_info "Syncing all packages to root version: $root_version"
    
    # Update all packages to match root
    for package in "${PACKAGES[@]}"; do
        if [[ -f "$package/package.json" ]]; then
            current_version=$(get_current_version "$package/package.json")
            if [[ "$current_version" != "$root_version" ]]; then
                update_package_version "$package/package.json" "$root_version"
            else
                log_info "$(basename "$package") already at version $root_version"
            fi
        fi
    done
    
    log_success "All packages synced to version $root_version"
}

check_versions() {
    log_info "Checking version consistency..."
    
    root_version=$(get_current_version "$ROOT_PACKAGE")
    inconsistent=false
    
    echo
    printf "%-25s %-15s %s\n" "Package" "Version" "Status"
    printf "%-25s %-15s %s\n" "-------" "-------" "------"
    printf "%-25s %-15s %s\n" "Root package" "$root_version" "✓"
    
    for package in "${PACKAGES[@]}"; do
        if [[ -f "$package/package.json" ]]; then
            package_name=$(basename "$package")
            version=$(get_current_version "$package/package.json")
            
            if [[ "$version" == "$root_version" ]]; then
                status="✓"
            else
                status="✗ (expected $root_version)"
                inconsistent=true
            fi
            
            printf "%-25s %-15s %s\n" "$package_name" "$version" "$status"
        fi
    done
    
    echo
    
    if [[ "$inconsistent" == "true" ]]; then
        log_warning "Version inconsistencies found!"
        log_info "Run '$0 sync' to fix inconsistencies"
        exit 1
    else
        log_success "All versions are consistent"
    fi
}

# Main script logic
main() {
    local command="$1"
    
    case "$command" in
        "show")
            show_versions
            ;;
        "bump")
            bump_version "$2"
            ;;
        "set")
            set_version "$2"
            ;;
        "sync")
            sync_versions
            ;;
        "check")
            check_versions
            ;;
        "-h"|"--help"|"help")
            show_help
            ;;
        "")
            log_error "Command is required"
            show_help
            exit 1
            ;;
        *)
            log_error "Unknown command: $command"
            show_help
            exit 1
            ;;
    esac
}

# Check if we're in the right directory
if [[ ! -f "package.json" ]] || [[ ! -d "packages" ]]; then
    log_error "This script must be run from the ZenithKernel root directory"
    exit 1
fi

# Run main function
main "$@"
