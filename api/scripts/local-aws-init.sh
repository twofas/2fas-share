#!/bin/bash
# SPDX-License-Identifier: BUSL-1.1
#
# Copyright © 2025 Two Factor Authentication Service, Inc.
# Licensed under the Business Source License 1.1
# See LICENSE file for full terms

set -euo pipefail

DYNAMODB_ENDPOINT="${DYNAMODB_ENDPOINT:-http://localhost:5555}"

aws dynamodb create-table \
  --endpoint-url "$DYNAMODB_ENDPOINT" \
  --region us-east-1 \
  --table-name secrets \
  --attribute-definitions AttributeName=id,AttributeType=S \
  --key-schema AttributeName=id,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --no-cli-pager

aws dynamodb update-time-to-live \
  --endpoint-url "$DYNAMODB_ENDPOINT" \
  --region us-east-1 \
  --table-name secrets \
  --time-to-live-specification Enabled=true,AttributeName=valid_until \
  --no-cli-pager
