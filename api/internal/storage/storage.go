// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

package storage

import (
	"context"
	"errors"

	"github.com/twofas/2fas-share-server/internal/model"
)

var (
	ErrNotFound = errors.New("secret not found")
)

// Storage for the secrets. It should not return expired secrets. It should handle removal of the
// expired secrets from the storage.
type Storage interface {
	Create(ctx context.Context, secret *model.Secret) error
	Get(ctx context.Context, id string) (*model.Secret, error)
	Delete(ctx context.Context, id string) error
	Close() error
}
