#!/usr/bin/env bash
# Scaffolding script to create the directory structure for the location service

set -euo pipefail

mkdir -p \
  ./migrations \
  ./src/core/application/types \
  ./src/core/application/use-cases/{errors,locations} \
  ./src/core/domain/{entities,repositories,value-objects} \
  ./src/modules/locations/infrastructure/drizzle/repositories \
  ./src/modules/locations/infrastructure/interface/http/{controllers,dto/{request,response},mappers,routes} \
  ./src/shared/{config,database,utils} \
  ./src/tests

echo "Location service directory structure created successfully."

