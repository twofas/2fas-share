// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

package dynamodb_test

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"testing"
	"time"

	"github.com/twofas/2fas-share-server/internal/model"
	"github.com/twofas/2fas-share-server/internal/storage"
	"github.com/twofas/2fas-share-server/internal/storage/dynamodbtest"
)

func randomID() string {
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		panic(fmt.Sprintf("failed to generate random ID: %v", err))
	}
	return hex.EncodeToString(b)
}

func TestTTLExpiration(t *testing.T) {
	store := dynamodbtest.NewTestStorageOrSkip(t)
	defer store.Close()

	ctx := context.Background()
	id := randomID()

	secret := &model.Secret{
		ID:         id,
		Data:       "dGVzdC1kYXRh",
		ValidUntil: time.Now().Add(2 * time.Second),
		SingleUse:  false,
	}

	if err := store.Create(ctx, secret); err != nil {
		t.Fatalf("Create failed: %v", err)
	}

	// Should be retrievable immediately.
	got, err := store.Get(ctx, id)
	if err != nil {
		t.Fatalf("Get immediately after create failed: %v", err)
	}
	if got.ID != id {
		t.Fatalf("ID mismatch: got %q, want %q", got.ID, id)
	}

	// Wait for the TTL to expire.
	time.Sleep(3 * time.Second)

	_, err = store.Get(ctx, id)
	if !errors.Is(err, storage.ErrNotFound) {
		t.Errorf("Expected ErrNotFound after TTL expiration, got: %v", err)
	}
}
