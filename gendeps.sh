#!/bin/bash

npx dependency-cruise -T dot --config .dependency-cruiser.cjs --max-depth 15 -x node_modules  -v -- src  | dot -T png > tslint-without-node_modules.png
npx dependency-cruise -T json --config .dependency-cruiser.cjs --max-depth 15 -x node_modules -v -- src  > full_deps.json