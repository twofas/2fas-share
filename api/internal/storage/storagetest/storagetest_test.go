// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

// Package storagetest provides a test suite for storage.Storage implementations.
package storagetest

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"log/slog"
	"path/filepath"
	"sync"
	"testing"
	"testing/synctest"
	"time"

	"github.com/google/go-cmp/cmp"

	"github.com/twofas/2fas-share-server/internal/model"
	"github.com/twofas/2fas-share-server/internal/storage"
	"github.com/twofas/2fas-share-server/internal/storage/bbolt"
	"github.com/twofas/2fas-share-server/internal/storage/dynamodbtest"
	"github.com/twofas/2fas-share-server/internal/storage/inmemory"
)

// StorageFactory is a function that creates a new storage instance for testing.
type StorageFactory func(t *testing.T) storage.Storage

// randomID generates a random ID for test isolation.
func randomID() string {
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		panic(fmt.Sprintf("failed to generate random ID: %v", err))
	}
	return hex.EncodeToString(b)
}

var storageFactories = []struct {
	name             string
	factory          StorageFactory
	supportsSyncTest bool
}{
	{"inmemory", newInMemoryStorage, true},
	{"bbolt", newBBoltStorage, true},
	{"dynamodb", newDynamoDBStorage, false},
}

func newInMemoryStorage(t *testing.T) storage.Storage {
	t.Helper()
	return inmemory.New(inmemory.Config{MaxCacheSize: 10 * 1024 * 1024}) // 10MiB for tests
}

func newBBoltStorage(t *testing.T) storage.Storage {
	t.Helper()
	tmpDir := t.TempDir()
	dbPath := filepath.Join(tmpDir, "test.db")

	store, err := bbolt.New(bbolt.Config{
		Path:            dbPath,
		CleanupInterval: time.Hour, // Long interval to avoid interference in tests
	}, slog.Default())
	if err != nil {
		t.Fatalf("Failed to create bbolt storage: %v", err)
	}
	return store
}

func newDynamoDBStorage(t *testing.T) storage.Storage {
	t.Helper()
	return dynamodbtest.NewTestStorageOrSkip(t)
}

func TestStorage_CreateAndGet(t *testing.T) {
	for _, tc := range storageFactories {
		t.Run(tc.name, func(t *testing.T) {
			store := tc.factory(t)
			defer store.Close()

			ctx := context.Background()
			secret := &model.Secret{
				ID:         randomID(),
				Data:       "dGVzdCBkYXRh",
				ValidUntil: time.Now().Add(time.Hour),
				SingleUse:  false,
			}

			err := store.Create(ctx, secret)
			if err != nil {
				t.Fatalf("Create failed: %v", err)
			}

			retrieved, err := store.Get(ctx, secret.ID)
			if err != nil {
				t.Fatalf("Get failed: %v", err)
			}

			if diff := cmp.Diff(*secret, *retrieved); diff != "" {
				t.Errorf("Secret mismatch (-want +got):\n%s", diff)
			}
		})
	}
}

func TestStorage_GetNotFound(t *testing.T) {
	for _, tc := range storageFactories {
		t.Run(tc.name, func(t *testing.T) {
			store := tc.factory(t)
			defer store.Close()

			ctx := context.Background()
			_, err := store.Get(ctx, randomID())
			if !errors.Is(err, storage.ErrNotFound) {
				t.Errorf("Expected ErrNotFound, got: %v", err)
			}
		})
	}
}

func TestStorage_ExpiredNotStored(t *testing.T) {
	for _, tc := range storageFactories {
		t.Run(tc.name, func(t *testing.T) {
			store := tc.factory(t)
			defer store.Close()

			ctx := context.Background()
			secret := &model.Secret{
				ID:         randomID(),
				Data:       "dGVzdA==",
				ValidUntil: time.Now().Add(-time.Hour),
				SingleUse:  false,
			}

			// Create should succeed (but not store the expired item)
			err := store.Create(ctx, secret)
			if err != nil {
				t.Fatalf("Create failed: %v", err)
			}

			// Get should return not found since expired items aren't stored
			_, err = store.Get(ctx, secret.ID)
			if !errors.Is(err, storage.ErrNotFound) {
				t.Errorf("Expected ErrNotFound for expired secret, got: %v", err)
			}
		})
	}
}

func TestStorage_Delete(t *testing.T) {
	for _, tc := range storageFactories {
		t.Run(tc.name, func(t *testing.T) {
			store := tc.factory(t)
			defer store.Close()

			ctx := context.Background()
			secret := &model.Secret{
				ID:         randomID(),
				Data:       "dGVzdA==",
				ValidUntil: time.Now().Add(time.Hour),
				SingleUse:  false,
			}

			err := store.Create(ctx, secret)
			if err != nil {
				t.Fatalf("Create failed: %v", err)
			}

			err = store.Delete(ctx, secret.ID)
			if err != nil {
				t.Fatalf("Delete failed: %v", err)
			}

			_, err = store.Get(ctx, secret.ID)
			if !errors.Is(err, storage.ErrNotFound) {
				t.Errorf("Expected ErrNotFound after delete, got: %v", err)
			}

			// Deleting an entry which does not exist, shouldn't be an error.
			err = store.Delete(ctx, secret.ID)
			if err != nil {
				t.Fatalf("Second delete failed: %v", err)
			}
		})
	}
}

func TestStorage_SingleUseFlag(t *testing.T) {
	for _, tc := range storageFactories {
		t.Run(tc.name, func(t *testing.T) {
			store := tc.factory(t)
			defer store.Close()

			ctx := context.Background()
			secret := &model.Secret{
				ID:         randomID(),
				Data:       "c2VjcmV0",
				ValidUntil: time.Now().Add(time.Hour),
				SingleUse:  true,
			}

			err := store.Create(ctx, secret)
			if err != nil {
				t.Fatalf("Create failed: %v", err)
			}

			retrieved, err := store.Get(ctx, secret.ID)
			if err != nil {
				t.Fatalf("Get failed: %v", err)
			}

			if !retrieved.SingleUse {
				t.Error("SingleUse should be true")
			}
		})
	}
}

func TestStorage_ConcurrentCreate(t *testing.T) {
	for _, tc := range storageFactories {
		t.Run(tc.name, func(t *testing.T) {
			store := tc.factory(t)
			defer store.Close()

			ctx := context.Background()
			numSecrets := 40
			numWorkers := 4
			prefix := randomID()

			work := make(chan int, numSecrets)
			for i := 0; i < numSecrets; i++ {
				work <- i
			}
			close(work)

			errs := make(chan error, numSecrets)

			var wg sync.WaitGroup
			wg.Add(numWorkers)

			for w := 0; w < numWorkers; w++ {
				go func() {
					defer wg.Done()
					for idx := range work {
						secret := &model.Secret{
							ID:         fmt.Sprintf("%s-%d", prefix, idx),
							Data:       fmt.Sprintf("data-%d", idx),
							ValidUntil: time.Now().Add(time.Hour),
							SingleUse:  false,
						}

						if err := store.Create(ctx, secret); err != nil {
							errs <- err
						}
					}
				}()
			}

			wg.Wait()
			close(errs)

			for err := range errs {
				t.Errorf("Concurrent create failed: %v", err)
			}

			// Verify all secrets were created
			for i := 0; i < numSecrets; i++ {
				_, err := store.Get(ctx, fmt.Sprintf("%s-%d", prefix, i))
				if err != nil {
					t.Errorf("Failed to get secret %d: %v", i, err)
				}
			}
		})
	}
}

func TestStorage_ConcurrentGet(t *testing.T) {
	for _, tc := range storageFactories {
		t.Run(tc.name, func(t *testing.T) {
			store := tc.factory(t)
			defer store.Close()

			ctx := context.Background()

			// Create a single secret
			secret := &model.Secret{
				ID:         randomID(),
				Data:       "shared-data",
				ValidUntil: time.Now().Add(time.Hour),
				SingleUse:  false,
			}
			if err := store.Create(ctx, secret); err != nil {
				t.Fatalf("Failed to create secret: %v", err)
			}

			// Get it concurrently
			numGets := 100
			var wg sync.WaitGroup
			wg.Add(numGets)

			errs := make(chan error, numGets)

			for i := 0; i < numGets; i++ {
				go func() {
					defer wg.Done()

					retrieved, err := store.Get(ctx, secret.ID)
					if err != nil {
						errs <- err
						return
					}
					if retrieved.Data != secret.Data {
						errs <- fmt.Errorf("data mismatch: got %s, want %s", retrieved.Data, secret.Data)
					}
				}()
			}

			wg.Wait()
			close(errs)

			for err := range errs {
				t.Errorf("Concurrent get failed: %v", err)
			}
		})
	}
}

func TestStorage_ConcurrentCreateAndGet(t *testing.T) { //nolint:gocognit
	for _, tc := range storageFactories {
		t.Run(tc.name, func(t *testing.T) {
			store := tc.factory(t)
			defer store.Close()

			ctx := context.Background()
			prefix := randomID()

			// Create initial secrets
			numInitial := 10
			for i := 0; i < numInitial; i++ {
				secret := &model.Secret{
					ID:         fmt.Sprintf("%s-initial-%d", prefix, i),
					Data:       fmt.Sprintf("initial-data-%d", i),
					ValidUntil: time.Now().Add(time.Hour),
					SingleUse:  false,
				}
				if err := store.Create(ctx, secret); err != nil {
					t.Fatalf("Failed to create initial secret: %v", err)
				}
			}

			// Run mixed operations concurrently
			numOps := 40
			numWorkers := 4

			work := make(chan int, numOps)
			for i := 0; i < numOps; i++ {
				work <- i
			}
			close(work)

			var wg sync.WaitGroup
			wg.Add(numWorkers)

			for w := 0; w < numWorkers; w++ {
				go func() {
					defer wg.Done()
					for idx := range work {
						if idx%2 == 0 {
							// Create
							secret := &model.Secret{
								ID:         fmt.Sprintf("%s-mixed-%d", prefix, idx),
								Data:       fmt.Sprintf("mixed-data-%d", idx),
								ValidUntil: time.Now().Add(time.Hour),
								SingleUse:  false,
							}
							if err := store.Create(ctx, secret); err != nil {
								t.Errorf("create %d failed: %v", idx, err)
							}
						} else {
							// Get
							_, err := store.Get(ctx, fmt.Sprintf("%s-initial-%d", prefix, idx%numInitial))
							if err != nil {
								t.Errorf("get %d failed: %v", idx, err)
							}
						}
					}
				}()
			}

			wg.Wait()
		})
	}
}

func TestStorage_TTLExpiration(t *testing.T) {
	for _, tc := range storageFactories {
		if !tc.supportsSyncTest {
			continue
		}
		t.Run(tc.name, func(t *testing.T) {
			synctest.Test(t, func(t *testing.T) {
				store := tc.factory(t)
				defer store.Close()

				ctx := context.Background()

				id := randomID()

				// Create a secret with 1 hour TTL
				secret := &model.Secret{
					ID:         id,
					Data:       "test-data",
					ValidUntil: time.Now().Add(time.Hour),
					SingleUse:  false,
				}

				err := store.Create(ctx, secret)
				if err != nil {
					t.Fatalf("Create failed: %v", err)
				}

				// Should be retrievable immediately
				_, err = store.Get(ctx, id)
				if err != nil {
					t.Fatalf("Get immediately after create failed: %v", err)
				}

				time.Sleep(time.Hour / 2)

				// Make sure touch does not restart TTL
				_, err = store.Get(ctx, secret.ID)
				if err != nil {
					t.Fatalf("Get some time after create failed: %v", err)
				}

				// Advance past TTL.
				time.Sleep(time.Hour/2 + time.Second)

				// Should be gone now
				_, err = store.Get(ctx, secret.ID)
				if !errors.Is(err, storage.ErrNotFound) {
					t.Errorf("Expected ErrNotFound after TTL expiration, got: %v", err)
				}
			})
		})
	}
}
