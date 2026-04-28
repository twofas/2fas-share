// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

package config

import (
	"fmt"
	"time"

	"github.com/ilyakaznacheev/cleanenv"

	"github.com/twofas/2fas-share-server/internal/handler"
	"github.com/twofas/2fas-share-server/internal/storage/bbolt"
	"github.com/twofas/2fas-share-server/internal/storage/dynamodb"
	"github.com/twofas/2fas-share-server/internal/storage/inmemory"
)

// BackendType represents the type of storage backend to use.
type BackendType string

const (
	BackendInMemory BackendType = "inmemory"
	BackendBBolt    BackendType = "bbolt"
	BackendDynamoDB BackendType = "dynamodb"
)

// BaseConfig holds configuration that is always required.
type BaseConfig struct {
	Port           string        `env:"PORT" env-default:"8080"`
	StorageBackend BackendType   `env:"STORAGE_BACKEND" env-required:"true"`
	ReadTimeout    time.Duration `env:"READ_TIMEOUT" env-default:"3s"`
	WriteTimeout   time.Duration `env:"WRITE_TIMEOUT" env-default:"5s"`
	FrontendDir    string        `env:"FRONTEND_DIR" env-default:""`
	handler.Config
}

func (c BaseConfig) Validate() error {
	if c.Port == "" {
		return fmt.Errorf("invalid port PORT: must not be empty, got %q", c.Port)
	}
	if c.ReadTimeout <= 0 {
		return fmt.Errorf("invalid read timeout READ_TIMEOUT: must be > 0, got %v", c.ReadTimeout)
	}
	if c.WriteTimeout <= 0 {
		return fmt.Errorf("invalid write timeout WRITE_TIMEOUT: must be > 0, got %v", c.WriteTimeout)
	}
	return c.Config.Validate() //nolint:wrapcheck
}

type Config struct {
	BaseConfig
	InMemory inmemory.Config
	BBolt    bbolt.Config
	DynamoDB dynamodb.Config
}

func (c Config) Validate() error {
	if err := c.BaseConfig.Validate(); err != nil {
		return err
	}

	switch c.StorageBackend {
	case BackendInMemory:
		return c.InMemory.Validate() //nolint:wrapcheck
	case BackendBBolt:
		return c.BBolt.Validate() //nolint:wrapcheck
	case BackendDynamoDB:
		return c.DynamoDB.Validate() //nolint:wrapcheck
	default:
		return fmt.Errorf(
			"invalid storage backend STORAGE_BACKEND: must be 'inmemory', 'bbolt', or 'dynamodb', got %q",
			c.StorageBackend,
		)
	}
}

func Load() (*Config, error) {
	var cfg Config
	if err := cleanenv.ReadEnv(&cfg.BaseConfig); err != nil {
		return nil, fmt.Errorf("reading env config: %w", err)
	}

	switch cfg.StorageBackend {
	case BackendInMemory:
		if err := cleanenv.ReadEnv(&cfg.InMemory); err != nil {
			return nil, fmt.Errorf("reading inmemory config: %w", err)
		}
	case BackendBBolt:
		if err := cleanenv.ReadEnv(&cfg.BBolt); err != nil {
			return nil, fmt.Errorf("reading bbolt config: %w", err)
		}
	case BackendDynamoDB:
		if err := cleanenv.ReadEnv(&cfg.DynamoDB); err != nil {
			return nil, fmt.Errorf("reading dynamodb config: %w", err)
		}
	default:
		return nil, fmt.Errorf(
			"invalid storage backend STORAGE_BACKEND: must be 'inmemory', 'bbolt', or 'dynamodb', got %q",
			cfg.StorageBackend,
		)
	}

	if err := cfg.Validate(); err != nil {
		return nil, fmt.Errorf("validating config: %w", err)
	}

	return &cfg, nil
}
