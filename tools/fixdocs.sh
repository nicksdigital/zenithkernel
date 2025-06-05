#!/bin/bash

# Move architecture documentation
mv ZenithFrameworkDocs.md docs/architecture/overview.md
mv rendering_pipeline.md docs/architecture/rendering-pipeline.md
mv ULTIMATE_FEATURES.md docs/architecture/features.md
cp zenith_system_summary.json docs/architecture/

# Move development documentation
mv zenith_development_tools.md docs/development/tools.md
mv zenith_implementation_plan.md docs/development/implementation-plan.md
mv modules_scaffolding.md docs/development/modules-scaffolding.md
cp zenith_todo.json docs/development/

# Move API documentation
mv hydra-cli.md docs/api/hydra-cli.md
mv useHydraEvents.md docs/api/hooks.md
mv Syntax.md docs/api/syntax.md

# Move integration documentation
mv ARCHIPELAGO_INTEGRATION_ANALYSIS.md docs/integration/archipelago-integration.md
mv Syntax_INTEGRATION.md docs/integration/syntax-integration.md

# Move reference materials
if [ -d reference_papers ]; then
  cp -r reference_papers/* docs/references/
fi

# Create a docs README
cat > docs/README.md << 'EOL'
# Zenith Framework Documentation
