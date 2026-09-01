// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

package middleware

import (
	"context"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"testing"
)

func testLogger() *slog.Logger {
	return slog.New(slog.DiscardHandler)
}

func TestLogging_CapturesStatusCode(t *testing.T) {
	tests := []struct {
		name           string
		handlerStatus  int
		expectedStatus int
	}{
		{"OK", http.StatusOK, http.StatusOK},
		{"Created", http.StatusCreated, http.StatusCreated},
		{"BadRequest", http.StatusBadRequest, http.StatusBadRequest},
		{"NotFound", http.StatusNotFound, http.StatusNotFound},
		{"InternalServerError", http.StatusInternalServerError, http.StatusInternalServerError},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			handler := http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
				w.WriteHeader(tt.handlerStatus)
			})

			req := httptest.NewRequestWithContext(context.Background(), http.MethodGet, "/test", nil)
			w := httptest.NewRecorder()

			Logging(testLogger())(handler).ServeHTTP(w, req)

			if w.Code != tt.expectedStatus {
				t.Errorf("Expected status %d, got %d", tt.expectedStatus, w.Code)
			}
		})
	}
}

func TestLogging_DefaultStatusOK(t *testing.T) {
	handler := http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		_, _ = w.Write([]byte("OK"))
	})

	req := httptest.NewRequestWithContext(context.Background(), http.MethodGet, "/test", nil)
	w := httptest.NewRecorder()

	Logging(testLogger())(handler).ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status %d, got %d", http.StatusOK, w.Code)
	}
}

func TestLogging_PassesRequestThrough(t *testing.T) {
	called := false
	handler := http.HandlerFunc(func(_ http.ResponseWriter, r *http.Request) {
		called = true
		if r.Method != http.MethodPost {
			t.Errorf("Expected method POST, got %s", r.Method)
		}
		if r.URL.Path != "/secret" {
			t.Errorf("Expected path /secret, got %s", r.URL.Path)
		}
	})

	req := httptest.NewRequestWithContext(context.Background(), http.MethodPost, "/secret", nil)
	w := httptest.NewRecorder()

	Logging(testLogger())(handler).ServeHTTP(w, req)

	if !called {
		t.Error("Handler was not called")
	}
}
