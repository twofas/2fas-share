// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

package model

import "time"

type Secret struct {
	ID         string    `json:"id"`
	Data       string    `json:"data"`
	CreatedAt  time.Time `json:"createdAt"`
	ValidUntil time.Time `json:"validUntil"`
	SingleUse  bool      `json:"singleUse"`
}

type CreateSecretRequest struct {
	Data            string `json:"data"`
	ValidForSeconds int    `json:"validForSeconds"`
	SingleUse       bool   `json:"singleUse"`
}

type CreateSecretResponse struct {
	ID         string    `json:"id"`
	CreatedAt  time.Time `json:"createdAt"`
	ValidUntil time.Time `json:"validUntil"`
	SingleUse  bool      `json:"singleUse"`
}
