// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

package handler

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"testing/fstest"
)

func TestHandler_Throttle_NoOpWhenDisabled(t *testing.T) {
	store := newTestStorage()
	defer store.Close()
	h := NewHandler(store, defaultServerConfig, fstest.MapFS{}, testLogger())
	srv := h.Handler()

	for range 20 {
		req := httptest.NewRequest(http.MethodPost, "/api/secret", strings.NewReader(reqBody))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		srv.ServeHTTP(w, req)

		if w.Code != http.StatusCreated {
			t.Fatalf("expected 201, got %d", w.Code)
		}
	}
}

func TestHandler_Throttle_Returns429WhenOverLimit(t *testing.T) {
	store := newTestStorage()
	defer store.Close()
	cfg := defaultServerConfig
	cfg.AllowedQPS = 1
	cfg.Burst = 1
	h := NewHandler(store, cfg, fstest.MapFS{}, testLogger())
	srv := h.Handler()

	// First request consumes the burst token.
	req := httptest.NewRequest(http.MethodPost, "/api/secret", strings.NewReader(reqBody))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	srv.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Fatalf("first request: expected 201, got %d", w.Code)
	}

	// Second request should be throttled.
	req = httptest.NewRequest(http.MethodPost, "/api/secret", strings.NewReader(reqBody))
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	srv.ServeHTTP(w, req)

	if w.Code != http.StatusTooManyRequests {
		t.Fatalf("second request: expected 429, got %d", w.Code)
	}
}

func TestHandler_Throttle_DoesNotThrottleHealth(t *testing.T) {
	store := newTestStorage()
	defer store.Close()
	cfg := defaultServerConfig
	cfg.AllowedQPS = 1
	cfg.Burst = 1
	h := NewHandler(store, cfg, fstest.MapFS{}, testLogger())
	srv := h.Handler()

	// Exhaust the rate limiter via a secret request.
	req := httptest.NewRequest(http.MethodPost, "/api/secret", strings.NewReader(reqBody))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	srv.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Fatalf("secret request: expected 201, got %d", w.Code)
	}

	// Health endpoint should still work.
	for range 10 {
		req = httptest.NewRequest(http.MethodGet, "/api/health", nil)
		w = httptest.NewRecorder()
		srv.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Fatalf("health: expected 200, got %d", w.Code)
		}
	}
}

func TestHandler_Throttle_DoesNotThrottleOptions(t *testing.T) {
	store := newTestStorage()
	defer store.Close()
	cfg := defaultServerConfig
	cfg.AllowedQPS = 1
	cfg.Burst = 1
	h := NewHandler(store, cfg, fstest.MapFS{}, testLogger())
	srv := h.Handler()

	// Exhaust the rate limiter via a secret request.
	req := httptest.NewRequest(http.MethodPost, "/api/secret", strings.NewReader(reqBody))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	srv.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Fatalf("secret request: expected 201, got %d", w.Code)
	}

	// OPTIONS preflight should still work (handled by CORS before reaching the router).
	req = httptest.NewRequest(http.MethodOptions, "/api/secret", nil)
	w = httptest.NewRecorder()
	srv.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("OPTIONS: expected 200, got %d", w.Code)
	}
}
