// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

package inmemory

import (
	"context"
	"sync/atomic"
	"time"

	"github.com/jellydator/ttlcache/v3"

	"github.com/twofas/2fas-share-server/internal/model"
	"github.com/twofas/2fas-share-server/internal/storage"
)

// Config holds configuration for the in-memory storage backend.
type Config struct {
	MaxCacheSize int64 `env:"INMEMORY_MAX_CACHE_SIZE" env-default:"104857600"` // 100MiB in bytes
}

func (c Config) Validate() error {
	return nil
}

// Storage implements storage.Storage interface using in-memory ttlcache.
type Storage struct {
	cache           *ttlcache.Cache[string, *model.Secret]
	numberOfEvicted uint64
}

// secretCost calculates the memory cost of storing a secret.
// Returns approximate size in bytes: ID length + Data length + fixed overhead for struct fields.
func secretCost(item ttlcache.CostItem[string, *model.Secret]) uint64 {
	const structOverhead = 88 // approximate overhead for struct, pointers, two time.Time fields, bool
	keySize := uint64(len(item.Key))
	dataSize := uint64(len(item.Value.Data))
	idSize := uint64(len(item.Value.ID))
	return structOverhead + keySize + dataSize + idSize
}

// New creates a new in-memory storage with the specified configuration.
// If maxSizeBytes <= 0, no size limit is applied.
func New(cfg Config) *Storage {
	s := &Storage{}

	opts := []ttlcache.Option[string, *model.Secret]{
		ttlcache.WithDisableTouchOnHit[string, *model.Secret](),
	}

	if cfg.MaxCacheSize > 0 {
		opts = append(opts, ttlcache.WithMaxCost[string, *model.Secret](uint64(cfg.MaxCacheSize), secretCost))
	}

	cache := ttlcache.New(opts...)

	cache.OnEviction(func(_ context.Context, reason ttlcache.EvictionReason, _ *ttlcache.Item[string, *model.Secret]) {
		if reason == ttlcache.EvictionReasonExpired {
			atomic.AddUint64(&s.numberOfEvicted, 1)
		}
	})

	// Start the automatic cleanup goroutine
	go cache.Start()

	s.cache = cache
	return s
}

func (s *Storage) Create(_ context.Context, secret *model.Secret) error {
	ttl := time.Until(secret.ValidUntil)
	if ttl <= 0 {
		// Secret is already expired, don't store it.
		// There is no need to return an error. This is a similar situation to storing a secret and immediately evicting it.
		// And yet, we need to check for <=0, because the library gives special meaning to the values 0, -1 and -2.
		return nil
	}

	s.cache.Set(secret.ID, secret, ttl)
	return nil
}

func (s *Storage) Get(_ context.Context, id string) (*model.Secret, error) {
	item := s.cache.Get(id)
	if item == nil {
		return nil, storage.ErrNotFound
	}
	return item.Value(), nil
}

func (s *Storage) Delete(_ context.Context, id string) error {
	s.cache.Delete(id)
	return nil
}

func (s *Storage) Close() error {
	s.cache.Stop()
	return nil
}
