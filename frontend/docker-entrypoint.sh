#!/bin/sh
set -e

# Sincroniza node_modules (volume do Docker) com o package.json atual.
npm install --no-audit --no-fund --loglevel=error

exec "$@"
