#!/bin/bash
# SPDX-License-Identifier: BUSL-1.1
#
# Copyright © 2025 Two Factor Authentication Service, Inc.
# Licensed under the Business Source License 1.1
# See LICENSE file for full terms

set -euo pipefail

MOTO_URL="${MOTO_URL:-http://localhost:5555/moto-api/}"
TIMEOUT="${TIMEOUT:-30}"

echo "Waiting for moto at ${MOTO_URL} (timeout: ${TIMEOUT}s)..."

for i in $(seq 1 "$TIMEOUT"); do
  if curl -sf "${MOTO_URL}" > /dev/null 2>&1; then
    echo "moto is ready after ${i}s"
    exit 0
  fi
  sleep 1
done

echo "ERROR: moto did not become ready within ${TIMEOUT}s"
exit 1
