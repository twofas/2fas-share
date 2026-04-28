// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

package middleware

import (
	"log/slog"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestThrottle_NoOpWhenQPSZero(t *testing.T) {
	mw := Throttle(ThrottleConfig{AllowedQPS: 0, Burst: 0}, slog.New(slog.DiscardHandler))
	inner := http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
	})
	h := mw(inner)

	for range 100 {
		rec := httptest.NewRecorder()
		h.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/secret/abc", nil))
		if rec.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d", rec.Code)
		}
	}
}

func TestThrottle_AllowsRequestsUnderLimit(t *testing.T) {
	mw := Throttle(ThrottleConfig{AllowedQPS: 10, Burst: 10}, slog.New(slog.DiscardHandler))
	inner := http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
	})
	h := mw(inner)

	// First request should always succeed (within burst).
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/secret/abc", nil))
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}
}

func TestThrottle_Returns429WhenOverLimit(t *testing.T) {
	// burst=1 means only 1 request is immediately available.
	mw := Throttle(ThrottleConfig{AllowedQPS: 1, Burst: 1}, slog.New(slog.DiscardHandler))
	inner := http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
	})
	h := mw(inner)

	// First request consumes the burst token.
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/secret/abc", nil))
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}

	// Second request should be throttled.
	rec = httptest.NewRecorder()
	h.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/secret/abc", nil))
	if rec.Code != http.StatusTooManyRequests {
		t.Fatalf("expected 429, got %d", rec.Code)
	}

	ct := rec.Header().Get("Content-Type")
	if ct != "application/json" {
		t.Fatalf("expected Content-Type application/json, got %q", ct)
	}
}

func TestThrottle_BurstAllowsMultipleImmediateRequests(t *testing.T) {
	// Rate 1 qps but burst of 5 — first 5 requests should succeed.
	mw := Throttle(ThrottleConfig{AllowedQPS: 1, Burst: 5}, slog.New(slog.DiscardHandler))
	inner := http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
	})
	h := mw(inner)

	for i := range 5 {
		rec := httptest.NewRecorder()
		h.ServeHTTP(rec, httptest.NewRequest(http.MethodPost, "/secret", nil))
		if rec.Code != http.StatusOK {
			t.Fatalf("request %d: expected 200, got %d", i, rec.Code)
		}
	}

	// 6th should be throttled.
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, httptest.NewRequest(http.MethodPost, "/secret", nil))
	if rec.Code != http.StatusTooManyRequests {
		t.Fatalf("expected 429, got %d", rec.Code)
	}
}
