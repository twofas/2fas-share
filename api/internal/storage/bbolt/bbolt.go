// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

package bbolt

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"sync"
	"sync/atomic"
	"time"

	bolt "go.etcd.io/bbolt"

	"github.com/twofas/2fas-share-server/internal/model"
	"github.com/twofas/2fas-share-server/internal/storage"
)

var bucketName = []byte("secrets")

// Config holds configuration for the BBolt storage backend.
type Config struct {
	Path            string        `env:"BBOLT_PATH" env-default:"share.db"`
	CleanupInterval time.Duration `env:"BBOLT_CLEANUP_INTERVAL" env-default:"60s"`
}

func (c Config) Validate() error {
	if c.CleanupInterval <= 0 {
		return fmt.Errorf("invalid cleanup interval BBOLT_CLEANUP_INTERVAL: must be > 0, got %v", c.CleanupInterval)
	}
	if c.Path == "" {
		return fmt.Errorf("invalid path BBOLT_PATH: must not be empty, got %q", c.Path)
	}
	return nil
}

// Storage implements storage.Storage interface using BBolt.
type Storage struct {
	db              *bolt.DB
	stopCh          chan struct{}
	cleanupWG       sync.WaitGroup
	numberOfEvicted uint64
	log             *slog.Logger
}

// New creates a new BBolt storage with the specified configuration.
func New(cfg Config, log *slog.Logger) (*Storage, error) {
	db, err := bolt.Open(cfg.Path, 0600, &bolt.Options{
		Timeout: 1 * time.Second,
	})
	if err != nil {
		return nil, fmt.Errorf("opening database %q: %w", cfg.Path, err)
	}

	// Create the bucket if it doesn't exist
	err = db.Update(func(tx *bolt.Tx) error {
		_, err := tx.CreateBucketIfNotExists(bucketName)
		if err != nil {
			return fmt.Errorf("creating bucket: %w", err)
		}
		return nil
	})
	if err != nil {
		if closeErr := db.Close(); closeErr != nil {
			log.Error("Failed to close database after bucket creation error", slog.Any("error", closeErr))
		}
		return nil, fmt.Errorf("failed to initialize database: %w", err)
	}

	s := &Storage{
		db:     db,
		stopCh: make(chan struct{}),
		log:    log,
	}

	// Start the cleanup goroutine
	s.cleanupWG.Add(1)
	go s.cleanupLoop(cfg.CleanupInterval)

	return s, nil
}

func (s *Storage) Create(_ context.Context, secret *model.Secret) error {
	if time.Until(secret.ValidUntil) <= 0 {
		// Secret is already expired, don't store it.
		return nil
	}

	data, err := json.Marshal(secret)
	if err != nil {
		return fmt.Errorf("marshaling secret: %w", err)
	}

	err = s.db.Update(func(tx *bolt.Tx) error {
		b := tx.Bucket(bucketName)
		if b == nil {
			return fmt.Errorf("bucket %q not found", bucketName)
		}
		if err := b.Put([]byte(secret.ID), data); err != nil {
			return fmt.Errorf("storing secret: %w", err)
		}
		return nil
	})
	if err != nil {
		return fmt.Errorf("database update: %w", err)
	}
	return nil
}

func (s *Storage) Get(ctx context.Context, id string) (*model.Secret, error) {
	var secret model.Secret

	err := s.db.View(func(tx *bolt.Tx) error {
		b := tx.Bucket(bucketName)
		if b == nil {
			return fmt.Errorf("bucket %q not found", bucketName)
		}
		data := b.Get([]byte(id))
		if data == nil {
			return storage.ErrNotFound
		}
		if err := json.Unmarshal(data, &secret); err != nil {
			return fmt.Errorf("unmarshaling secret: %w", err)
		}
		return nil
	})

	if err != nil {
		if errors.Is(err, storage.ErrNotFound) {
			return nil, fmt.Errorf("secret %q not found: %w", id, err)
		}
		return nil, fmt.Errorf("database view: %w", err)
	}

	// Check if the secret has expired
	if time.Now().After(secret.ValidUntil) {
		s.deleteExpiredSecret(ctx, id)
		return nil, storage.ErrNotFound
	}

	return &secret, nil
}

func (s *Storage) deleteExpiredSecret(ctx context.Context, id string) {
	err := s.Delete(ctx, id)
	if err != nil {
		s.log.Error("Failed to delete expired secret", slog.Any("error", err))
	}
}

func (s *Storage) Delete(_ context.Context, id string) error {
	err := s.db.Update(func(tx *bolt.Tx) error {
		b := tx.Bucket(bucketName)
		if b == nil {
			return fmt.Errorf("bucket %q not found", bucketName)
		}
		if err := b.Delete([]byte(id)); err != nil {
			return fmt.Errorf("deleting secret: %w", err)
		}
		return nil
	})
	if err != nil {
		return fmt.Errorf("database update: %w", err)
	}
	return nil
}

func (s *Storage) Close() error {
	close(s.stopCh)
	// Wait for cleanup to finish before we close the database.
	s.cleanupWG.Wait()
	if err := s.db.Close(); err != nil {
		return fmt.Errorf("closing database: %w", err)
	}
	return nil
}

// cleanupLoop periodically removes expired secrets from the database.
func (s *Storage) cleanupLoop(interval time.Duration) {
	defer s.cleanupWG.Done()

	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	for {
		select {
		case <-s.stopCh:
			return
		case <-ticker.C:
			if err := s.deleteExpired(); err != nil {
				s.log.Error("Failed to delete expired secrets", "error", err)
			}
		}
	}
}

// deleteExpired removes all expired secrets from the database.
func (s *Storage) deleteExpired() error {
	now := time.Now()
	var expiredKeys [][]byte

	// First, collect all expired keys
	err := s.db.View(func(tx *bolt.Tx) error {
		b := tx.Bucket(bucketName)
		if b == nil {
			return fmt.Errorf("bucket %q not found", bucketName)
		}
		return b.ForEach(func(k, v []byte) error {
			var secret model.Secret
			if err := json.Unmarshal(v, &secret); err != nil {
				s.log.Error("Failed to unmarshal secret during cleanup", "key", string(k), "error", err)
				return nil // Continue with other entries
			}
			if now.After(secret.ValidUntil) {
				// Make a copy of the key
				keyCopy := make([]byte, len(k))
				copy(keyCopy, k)
				expiredKeys = append(expiredKeys, keyCopy)
			}
			return nil
		})
	})
	if err != nil {
		return fmt.Errorf("failed to scan for expired secrets: %w", err)
	}

	if len(expiredKeys) > 0 {
		err := s.db.Update(func(tx *bolt.Tx) error {
			b := tx.Bucket(bucketName)
			if b == nil {
				return fmt.Errorf("bucket %q not found", bucketName)
			}
			for _, k := range expiredKeys {
				if err := b.Delete(k); err != nil {
					return fmt.Errorf("failed to delete key %q: %w", string(k), err)
				}
				atomic.AddUint64(&s.numberOfEvicted, 1)
			}
			return nil
		})
		if err != nil {
			return fmt.Errorf("failed to delete expired secrets: %w", err)
		}
		s.log.Info("Deleted expired secrets", slog.Any("nbOfKeys", len(expiredKeys)))
	}

	return nil
}
