// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

package inmemory

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"sync/atomic"
	"testing"
	"testing/synctest"
	"time"

	"github.com/twofas/2fas-share-server/internal/model"
	"github.com/twofas/2fas-share-server/internal/storage"
)

func TestStorage_MaxSize(t *testing.T) {
	const cacheSizeInBytes = 336
	const entrySize = 112

	store := New(Config{MaxCacheSize: cacheSizeInBytes})
	defer store.Close()

	ctx := context.Background()

	numSecrets := 10
	for i := range numSecrets {
		// Cost of each entry is 88 + 2 * [key size] + [data size]
		// In this case this is 112.
		secret := &model.Secret{
			ID:         fmt.Sprintf("%2d", i),
			Data:       strings.Repeat("a", 20),
			ValidUntil: time.Now().Add(time.Hour),
			CreatedAt:  time.Now(),
			SingleUse:  false,
		}
		err := store.Create(ctx, secret)
		if err != nil {
			t.Fatalf("Create failed: %v", err)
		}
	}

	// Count how many secrets are still retrievable
	found := 0
	for i := range numSecrets {
		_, err := store.Get(ctx, fmt.Sprintf("%2d", i))
		if err == nil {
			found++
		} else if !errors.Is(err, storage.ErrNotFound) {
			t.Errorf("Unexpected error for secret %2d: %v", i, err)
		}
	}

	expectedNumberOfSecrets := cacheSizeInBytes / entrySize
	if found != expectedNumberOfSecrets {
		t.Errorf("Expected %d secrets, got %d", expectedNumberOfSecrets, found)
	}
}

func TestStorage_Expiration(t *testing.T) {
	synctest.Test(t, func(t *testing.T) {
		store := New(Config{MaxCacheSize: 10 * 1024 * 1024})
		defer store.Close()

		ctx := context.Background()

		// Create secrets with 1 hour TTL
		numSecrets := 5
		for i := range numSecrets {
			secret := &model.Secret{
				ID:         fmt.Sprintf("secret-%d", i),
				Data:       "test-data",
				ValidUntil: time.Now().Add(time.Hour),
				CreatedAt:  time.Now(),
				SingleUse:  false,
			}
			if err := store.Create(ctx, secret); err != nil {
				t.Fatalf("Create failed: %v", err)
			}
		}

		// Verify no evictions yet
		if evicted := atomic.LoadUint64(&store.numberOfEvicted); evicted != 0 {
			t.Errorf("Expected 0 evictions before expiration, got %d", evicted)
		}

		// Advance time past TTL
		time.Sleep(time.Hour + time.Second)

		// Verify all secrets were evicted
		if evicted := atomic.LoadUint64(&store.numberOfEvicted); evicted != uint64(numSecrets) {
			t.Errorf("Expected %d evictions after expiration, got %d", numSecrets, evicted)
		}
	})
}
