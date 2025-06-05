#!/bin/bash
echo "Checking for references to moved files..."

# Configuration files
echo -e "\nConfiguration files:"
grep -r "jest\.config\.js" --include="*.{ts,js,json,md}" . | grep -v "config/"
grep -r "as-pect\.config\.js" --include="*.{ts,js,json,md}" . | grep -v "config/"
grep -r "\.bunfig\.toml" --include="*.{ts,js,json,md}" . | grep -v "config/"

# Documentation files
echo -e "\nDocumentation files:"
grep -r "ZenithFrameworkDocs\.md" --include="*.{ts,js,json,md}" . | grep -v "docs/"
grep -r "rendering_pipeline\.md" --include="*.{ts,js,json,md}" . | grep -v "docs/"
grep -r "ULTIMATE_FEATURES\.md" --include="*.{ts,js,json,md}" . | grep -v "docs/"

echo -e "\nDone."
