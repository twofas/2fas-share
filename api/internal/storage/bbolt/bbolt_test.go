// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

package bbolt

import (
	"context"
	"fmt"
	"log/slog"
	"os"
	"path/filepath"
	"sync/atomic"
	"testing"
	"testing/synctest"
	"time"

	"github.com/google/go-cmp/cmp"

	"github.com/twofas/2fas-share-server/internal/model"
)

func TestStorage_Persistence(t *testing.T) {
	tmpDir := t.TempDir()
	dbPath := filepath.Join(tmpDir, "test.db")

	ctx := context.Background()
	secret := &model.Secret{
		ID:         "persistent-secret",
		Data:       "persistent-data",
		ValidUntil: time.Now().Add(time.Hour),
		SingleUse:  false,
	}

	// Create and close first storage instance
	store1, err := New(Config{Path: dbPath, CleanupInterval: time.Hour}, slog.Default())
	if err != nil {
		t.Fatalf("Failed to create first storage: %v", err)
	}

	err = store1.Create(ctx, secret)
	if err != nil {
		t.Fatalf("Create failed: %v", err)
	}
	store1.Close()

	// Open second storage instance and verify data persisted
	store2, err := New(Config{Path: dbPath, CleanupInterval: time.Hour}, slog.Default())
	if err != nil {
		t.Fatalf("Failed to create second storage: %v", err)
	}
	defer store2.Close()

	retrieved, err := store2.Get(ctx, secret.ID)
	if err != nil {
		t.Fatalf("Get after reopen failed: %v", err)
	}

	if diff := cmp.Diff(*secret, *retrieved); diff != "" {
		t.Errorf("Secret mismatch after persistence (-want +got):\n%s", diff)
	}
}

func TestNew_InvalidPath(t *testing.T) {
	// Try to create storage in a non-existent directory without write permission
	_, err := New(Config{
		Path:            "/nonexistent/path/test.db",
		CleanupInterval: time.Hour,
	}, slog.Default())
	if err == nil {
		t.Error("Expected error for invalid path, got nil")
	}
}

func TestNew_ExistingDB(t *testing.T) {
	tmpDir := t.TempDir()
	dbPath := filepath.Join(tmpDir, "test.db")

	// Create empty file
	f, err := os.Create(dbPath)
	if err != nil {
		t.Fatalf("Failed to create file: %v", err)
	}
	f.Close()

	// Should still work - bbolt can open existing files
	store, err := New(Config{Path: dbPath, CleanupInterval: time.Hour}, slog.Default())
	if err != nil {
		t.Fatalf("Failed to open existing DB: %v", err)
	}
	store.Close()
}

func TestStorage_Expiration(t *testing.T) {
	synctest.Test(t, func(t *testing.T) {
		tmpDir := t.TempDir()
		dbPath := filepath.Join(tmpDir, "test.db")

		// Create storage with 1 minute cleanup interval
		store, err := New(Config{Path: dbPath, CleanupInterval: time.Minute}, slog.Default())
		if err != nil {
			t.Fatalf("Failed to create storage: %v", err)
		}
		defer store.Close()

		ctx := context.Background()

		// Create secrets with 1 hour TTL
		numSecrets := 5
		for i := 0; i < numSecrets; i++ {
			secret := &model.Secret{
				ID:         fmt.Sprintf("secret-%d", i),
				Data:       "test-data",
				ValidUntil: time.Now().Add(time.Hour),
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

		// Advance time past TTL and cleanup interval
		time.Sleep(time.Hour + time.Minute + time.Second)

		// Verify all secrets were evicted
		if evicted := atomic.LoadUint64(&store.numberOfEvicted); evicted != uint64(numSecrets) {
			t.Errorf("Expected %d evictions after expiration, got %d", numSecrets, evicted)
		}
	})
}
