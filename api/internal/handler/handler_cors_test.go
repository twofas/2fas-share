// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

package handler

import (
	"context"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"testing/fstest"
	"time"

	"github.com/twofas/2fas-share-server/internal/model"
)

func assertCORSHeaders(t *testing.T, w *httptest.ResponseRecorder) {
	t.Helper()
	if got := w.Header().Get("Access-Control-Allow-Origin"); got != "*" {
		t.Errorf("Access-Control-Allow-Origin = %q, want %q", got, "*")
	}
	if got := w.Header().Get("Access-Control-Allow-Methods"); got != "GET, POST, OPTIONS" {
		t.Errorf("Access-Control-Allow-Methods = %q, want %q", got, "GET, POST, OPTIONS")
	}
	if got := w.Header().Get("Access-Control-Allow-Headers"); got != "Content-Type" {
		t.Errorf("Access-Control-Allow-Headers = %q, want %q", got, "Content-Type")
	}
}

func TestHandler_CORS_Headers(t *testing.T) {
	store := newTestStorage()
	defer store.Close()
	h := NewHandler(store, defaultServerConfig, fstest.MapFS{}, testLogger())
	srv := h.Handler()

	req := httptest.NewRequestWithContext(context.Background(), http.MethodGet, "/api/health", nil)
	w := httptest.NewRecorder()
	srv.ServeHTTP(w, req)

	assertCORSHeaders(t, w)
}

func TestHandler_CORS_PreflightRequest(t *testing.T) {
	store := newTestStorage()
	defer store.Close()
	h := NewHandler(store, defaultServerConfig, fstest.MapFS{}, testLogger())
	srv := h.Handler()

	req := httptest.NewRequestWithContext(context.Background(), http.MethodOptions, "/api/secret", nil)
	req.Header.Set("Origin", "https://example.com")
	req.Header.Set("Access-Control-Request-Method", "POST")
	w := httptest.NewRecorder()
	srv.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Preflight: expected status 200, got %d", w.Code)
	}
	assertCORSHeaders(t, w)
}

func TestHandler_CORS_CreateSecret(t *testing.T) {
	store := newTestStorage()
	defer store.Close()
	h := NewHandler(store, defaultServerConfig, fstest.MapFS{}, testLogger())
	srv := h.Handler()

	req := httptest.NewRequestWithContext(context.Background(), http.MethodPost, "/api/secret", strings.NewReader(reqBody))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	srv.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Errorf("Expected status 201, got %d", w.Code)
	}
	assertCORSHeaders(t, w)
}

func TestHandler_CORS_GetSecret(t *testing.T) {
	store := newTestStorage()
	defer store.Close()
	h := NewHandler(store, defaultServerConfig, fstest.MapFS{}, testLogger())

	secret := &model.Secret{
		ID:         "cors-test-id",
		Data:       "dGVzdA==",
		CreatedAt:  time.Now().UTC(),
		ValidUntil: time.Now().Add(time.Hour),
	}
	_ = store.Create(t.Context(), secret)

	srv := h.Handler()
	req := httptest.NewRequestWithContext(context.Background(), http.MethodGet, "/api/secret/cors-test-id", nil)
	w := httptest.NewRecorder()
	srv.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", w.Code)
	}
	assertCORSHeaders(t, w)
}
