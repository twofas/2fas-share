// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

package handler

import (
	"fmt"

	"github.com/twofas/2fas-share-server/internal/middleware"
)

const (
	DefaultMaxDataSize        = 16 * 1024         // 16KB
	DefaultMaxValidForSeconds = 30 * 24 * 60 * 60 // 30 days in seconds
	DefaultMaxRequestBodySize = 32 * 1024         // 32KB
)

// Config holds handler-level limits and rate-limiting configuration.
type Config struct {
	MaxDataSize        int   `env:"MAX_DATA_SIZE" env-default:"16384"`
	MaxValidForSeconds int   `env:"MAX_VALID_FOR_SECONDS" env-default:"2592000"`
	MaxRequestBodySize int64 `env:"MAX_REQUEST_BODY_SIZE" env-default:"32768"`
	middleware.ThrottleConfig
}

func (c Config) Validate() error {
	if c.MaxDataSize <= 0 {
		return fmt.Errorf("invalid max data size MAX_DATA_SIZE: must be > 0, got %d", c.MaxDataSize)
	}
	if c.MaxValidForSeconds <= 0 {
		return fmt.Errorf("invalid max valid-for seconds MAX_VALID_FOR_SECONDS: must be > 0, got %d", c.MaxValidForSeconds)
	}
	if c.MaxRequestBodySize <= 0 {
		return fmt.Errorf("invalid max request body size MAX_REQUEST_BODY_SIZE: must be > 0, got %d", c.MaxRequestBodySize)
	}
	return c.ThrottleConfig.Validate() //nolint:wrapcheck
}
