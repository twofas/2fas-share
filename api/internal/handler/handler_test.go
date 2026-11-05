// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

package handler

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync"
	"testing"
	"testing/fstest"
	"time"

	"github.com/google/go-cmp/cmp"

	"github.com/twofas/2fas-share-server/internal/model"
	"github.com/twofas/2fas-share-server/internal/storage"
	"github.com/twofas/2fas-share-server/internal/storage/inmemory"
)

// newTestStorage creates a new in-memory storage for testing.
func newTestStorage() storage.Storage {
	return inmemory.New(inmemory.Config{MaxCacheSize: 10 * 1024 * 1024}) // 10MiB for tests
}

func testLogger() *slog.Logger {
	return slog.New(slog.DiscardHandler)
}

var defaultServerConfig = Config{
	MaxDataSize:        DefaultMaxDataSize,
	MaxValidForSeconds: DefaultMaxValidForSeconds,
	MaxRequestBodySize: DefaultMaxRequestBodySize,
}

const reqBody = `{"data":"dGVzdA==","validForSeconds":3600,"singleUse":false}`

func TestHandler_CreateSecret_Success(t *testing.T) {
	store := newTestStorage()
	defer store.Close()
	h := NewHandler(store, defaultServerConfig, fstest.MapFS{}, testLogger())

	fixedTime := time.Date(2026, 2, 25, 12, 0, 0, 0, time.UTC)
	h.SetNowFunc(func() time.Time { return fixedTime })

	req := httptest.NewRequestWithContext(context.Background(), http.MethodPost, "/api/secret", strings.NewReader(reqBody))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	srv := h.Handler()
	srv.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Errorf("Expected status %d, got %d", http.StatusCreated, w.Code)
	}

	var resp model.CreateSecretResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("Failed to decode response: %v", err)
	}

	if resp.ID == "" {
		t.Error("Expected non-empty ID")
	}

	timeCmp := cmp.Comparer(func(x, y time.Time) bool { return x.Equal(y) })
	want := model.CreateSecretResponse{
		ID:         resp.ID,
		CreatedAt:  fixedTime,
		ValidUntil: fixedTime.Add(3600 * time.Second),
		SingleUse:  false,
	}
	if diff := cmp.Diff(want, resp, timeCmp); diff != "" {
		t.Errorf("Response mismatch (-want +got):\n%s", diff)
	}
}

var createSecretValidationCases = []struct {
	name           string
	body           string
	expectedStatus int
}{
	{
		name:           "invalid JSON",
		body:           "invalid json",
		expectedStatus: http.StatusBadRequest,
	},
	{
		name: "data too large",
		body: `{"data":"` + strings.Repeat("a", DefaultMaxDataSize+1) +
			`","validForSeconds":3600,"singleUse":false}`,
		expectedStatus: http.StatusBadRequest,
	},
	{
		name:           "validForSeconds negative",
		body:           `{"data":"dGVzdA==","validForSeconds":-1,"singleUse":false}`,
		expectedStatus: http.StatusBadRequest,
	},
	{
		name:           "validForSeconds zero",
		body:           `{"data":"dGVzdA==","validForSeconds":0,"singleUse":false}`,
		expectedStatus: http.StatusBadRequest,
	},
	{
		name:           "validForSeconds too large",
		body:           `{"data":"dGVzdA==","validForSeconds":9999999,"singleUse":false}`,
		expectedStatus: http.StatusBadRequest,
	},
	{
		name:           "invalid base64 data",
		body:           `{"data":"not-valid-base64!!!","validForSeconds":3600,"singleUse":false}`,
		expectedStatus: http.StatusBadRequest,
	},
	{
		name: "max data size allowed",
		body: fmt.Sprintf(`{"data":"%s","validForSeconds":3600,"singleUse":false}`,
			strings.Repeat("a", DefaultMaxDataSize)),
		expectedStatus: http.StatusCreated,
	},
	{
		name:           "max validForSeconds allowed",
		body:           `{"data":"dGVzdA==","validForSeconds":2592000,"singleUse":false}`,
		expectedStatus: http.StatusCreated,
	},
	{
		name:           "valid minimal request",
		body:           `{"data":"dGVzdA==","validForSeconds":1,"singleUse":false}`,
		expectedStatus: http.StatusCreated,
	},
	{
		name:           "valid with singleUse true",
		body:           `{"data":"dGVzdA==","validForSeconds":3600,"singleUse":true}`,
		expectedStatus: http.StatusCreated,
	},
	{
		name:           "empty data rejected",
		body:           `{"data":"","validForSeconds":3600,"singleUse":false}`,
		expectedStatus: http.StatusBadRequest,
	},
	{
		name: "request body too large",
		body: fmt.Sprintf(`{"data":"%s","validForSeconds":3600,"singleUse":false}`,
			strings.Repeat("a", int(DefaultMaxRequestBodySize))),
		expectedStatus: http.StatusBadRequest,
	},
}

func TestHandler_CreateSecret_Validation(t *testing.T) {
	for _, tt := range createSecretValidationCases {
		t.Run(tt.name, func(t *testing.T) {
			store := newTestStorage()
			defer store.Close()
			h := NewHandler(store, defaultServerConfig, fstest.MapFS{}, testLogger())

			req := httptest.NewRequestWithContext(context.Background(), http.MethodPost,
				"/api/secret", strings.NewReader(tt.body))
			req.Header.Set("Content-Type", "application/json")
			w := httptest.NewRecorder()

			srv := h.Handler()
			srv.ServeHTTP(w, req)

			if w.Code != tt.expectedStatus {
				t.Errorf("Expected status %d, got %d", tt.expectedStatus, w.Code)
			}
		})
	}
}

func TestHandler_GetSecret_Success(t *testing.T) {
	store := newTestStorage()
	defer store.Close()
	h := NewHandler(store, defaultServerConfig, fstest.MapFS{}, testLogger())

	secret := &model.Secret{
		ID:         "test-uuid",
		Data:       "c2VjcmV0IGRhdGE=",
		CreatedAt:  time.Now().UTC(),
		ValidUntil: time.Now().Add(time.Hour),
		SingleUse:  false,
	}
	_ = store.Create(t.Context(), secret)

	req := httptest.NewRequestWithContext(context.Background(), http.MethodGet, "/api/secret/test-uuid", nil)
	w := httptest.NewRecorder()

	srv := h.Handler()
	srv.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status %d, got %d", http.StatusOK, w.Code)
	}

	var resp model.Secret
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("Failed to decode response: %v", err)
	}

	if diff := cmp.Diff(*secret, resp); diff != "" {
		t.Errorf("Response mismatch (-want +got):\n%s", diff)
	}
}

func TestHandler_GetSecret_NotFound(t *testing.T) {
	store := newTestStorage()
	defer store.Close()
	h := NewHandler(store, defaultServerConfig, fstest.MapFS{}, testLogger())

	req := httptest.NewRequestWithContext(context.Background(), http.MethodGet, "/api/secret/nonexistent", nil)
	w := httptest.NewRecorder()

	srv := h.Handler()
	srv.ServeHTTP(w, req)

	if w.Code != http.StatusNotFound {
		t.Errorf("Expected status %d, got %d", http.StatusNotFound, w.Code)
	}
}

func TestHandler_ErrorResponseIsJSON(t *testing.T) {
	tests := []struct {
		name string
		// setup returns an HTTP request that will trigger an error.
		setup func() *http.Request
	}{
		{
			name: "invalid JSON on create",
			setup: func() *http.Request {
				return httptest.NewRequestWithContext(context.Background(), http.MethodPost,
					"/api/secret", strings.NewReader("not json"))
			},
		},
		{
			name: "empty data on create",
			setup: func() *http.Request {
				return httptest.NewRequestWithContext(context.Background(), http.MethodPost, "/api/secret",
					strings.NewReader(`{"data":"","validForSeconds":1}`))
			},
		},
		{
			name: "invalid base64 on create",
			setup: func() *http.Request {
				return httptest.NewRequestWithContext(context.Background(), http.MethodPost, "/api/secret",
					strings.NewReader(`{"data":"!!!","validForSeconds":1}`))
			},
		},
		{
			name: "not found on get",
			setup: func() *http.Request {
				return httptest.NewRequestWithContext(context.Background(), http.MethodGet, "/api/secret/no-such-id", nil)
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			store := newTestStorage()
			defer store.Close()
			h := NewHandler(store, defaultServerConfig, fstest.MapFS{}, testLogger())

			srv := h.Handler()

			w := httptest.NewRecorder()
			srv.ServeHTTP(w, tt.setup())
			assertJSONError(t, w)
		})
	}
}

func assertJSONError(t *testing.T, w *httptest.ResponseRecorder) {
	t.Helper()

	ct := w.Header().Get("Content-Type")
	if ct != "application/json" {
		t.Errorf("Content-Type = %q, want application/json", ct)
	}

	var body map[string]string
	if err := json.NewDecoder(w.Body).Decode(&body); err != nil {
		t.Fatalf("Failed to decode error body as JSON: %v", err)
	}
	if _, ok := body["error"]; !ok {
		t.Errorf("Response body missing \"error\" key: %v", body)
	}
	if len(body) != 1 {
		t.Errorf("Expected exactly 1 key in error response, got %d: %v",
			len(body), body)
	}
}

func TestHandler_GetSecret_SingleUseVsReusable(t *testing.T) {
	tests := []struct {
		name               string
		id                 string
		singleUse          bool
		expectedSecondCode int
	}{
		{
			name:               "single use secret deleted after access",
			id:                 "single-use-uuid",
			singleUse:          true,
			expectedSecondCode: http.StatusNotFound,
		},
		{
			name:               "reusable secret not deleted after access",
			id:                 "reusable-uuid",
			singleUse:          false,
			expectedSecondCode: http.StatusOK,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			store := newTestStorage()
			defer store.Close()
			h := NewHandler(store, defaultServerConfig, fstest.MapFS{}, testLogger())

			secret := &model.Secret{
				ID:         tt.id,
				Data:       "dGVzdCBkYXRh",
				CreatedAt:  time.Now().UTC(),
				ValidUntil: time.Now().Add(time.Hour),
				SingleUse:  tt.singleUse,
			}
			_ = store.Create(t.Context(), secret)

			srv := h.Handler()

			// First request should succeed
			req1 := httptest.NewRequestWithContext(context.Background(), http.MethodGet, "/api/secret/"+tt.id, nil)
			w1 := httptest.NewRecorder()
			srv.ServeHTTP(w1, req1)

			if w1.Code != http.StatusOK {
				t.Errorf("First request: expected status %d, got %d", http.StatusOK, w1.Code)
			}

			// Second request depends on singleUse
			req2 := httptest.NewRequestWithContext(context.Background(), http.MethodGet, "/api/secret/"+tt.id, nil)
			w2 := httptest.NewRecorder()
			srv.ServeHTTP(w2, req2)

			if w2.Code != tt.expectedSecondCode {
				t.Errorf("Second request: expected status %d, got %d", tt.expectedSecondCode, w2.Code)
			}
		})
	}
}

func TestHandler_ConcurrentCreateSecrets(t *testing.T) {
	store := newTestStorage()
	defer store.Close()
	h := NewHandler(store, defaultServerConfig, fstest.MapFS{}, testLogger())

	srv := h.Handler()

	numRequests := 100
	var wg sync.WaitGroup
	wg.Add(numRequests)

	results := make(chan int, numRequests)

	for i := range numRequests {
		go func(idx int) {
			defer wg.Done()

			data := base64.StdEncoding.EncodeToString(fmt.Appendf(nil, "data%d", idx))
			reqBody := fmt.Sprintf(`{"data":"%s","validForSeconds":3600,"singleUse":false}`, data)
			req := httptest.NewRequestWithContext(context.Background(), http.MethodPost, "/api/secret",
				strings.NewReader(reqBody))
			req.Header.Set("Content-Type", "application/json")
			w := httptest.NewRecorder()

			srv.ServeHTTP(w, req)
			results <- w.Code
		}(i)
	}

	wg.Wait()
	close(results)

	successCount := 0
	for code := range results {
		if code == http.StatusCreated {
			successCount++
		}
	}

	if successCount != numRequests {
		t.Errorf("Expected %d successful creates, got %d", numRequests, successCount)
	}
}

func TestHandler_ConcurrentGetSameSecret(t *testing.T) {
	store := newTestStorage()
	defer store.Close()
	h := NewHandler(store, defaultServerConfig, fstest.MapFS{}, testLogger())

	secret := &model.Secret{
		ID:         "concurrent-get-test",
		Data:       "Y29uY3VycmVudCBkYXRh",
		CreatedAt:  time.Now().UTC(),
		ValidUntil: time.Now().Add(time.Hour),
		SingleUse:  false,
	}
	_ = store.Create(t.Context(), secret)

	srv := h.Handler()

	numRequests := 100
	var wg sync.WaitGroup
	wg.Add(numRequests)

	results := make(chan int, numRequests)

	for range numRequests {
		go func() {
			defer wg.Done()

			req := httptest.NewRequestWithContext(context.Background(),
				http.MethodGet, "/api/secret/concurrent-get-test", nil)
			w := httptest.NewRecorder()

			srv.ServeHTTP(w, req)
			results <- w.Code
		}()
	}

	wg.Wait()
	close(results)

	successCount := 0
	for code := range results {
		if code == http.StatusOK {
			successCount++
		}
	}

	if successCount != numRequests {
		t.Errorf("Expected %d successful gets, got %d", numRequests, successCount)
	}
}

func TestHandler_ConcurrentSingleUseSecret_OnlyOneSucceeds(t *testing.T) {
	store := newTestStorage()
	defer store.Close()
	h := NewHandler(store, defaultServerConfig, fstest.MapFS{}, testLogger())

	secret := &model.Secret{
		ID:         "single-use-concurrent",
		Data:       "c2luZ2xlIHVzZQ==",
		CreatedAt:  time.Now().UTC(),
		ValidUntil: time.Now().Add(time.Hour),
		SingleUse:  true,
	}
	_ = store.Create(t.Context(), secret)

	srv := h.Handler()

	numRequests := 50
	var wg sync.WaitGroup
	wg.Add(numRequests)

	results := make(chan int, numRequests)

	for range numRequests {
		go func() {
			defer wg.Done()

			req := httptest.NewRequestWithContext(context.Background(),
				http.MethodGet, "/api/secret/single-use-concurrent", nil)
			w := httptest.NewRecorder()

			srv.ServeHTTP(w, req)
			results <- w.Code
		}()
	}

	wg.Wait()
	close(results)

	successCount := 0
	notFoundCount := 0
	for code := range results {
		switch code {
		case http.StatusOK:
			successCount++
		case http.StatusNotFound:
			notFoundCount++
		}
	}

	// At least one should succeed, and the rest should get 404
	if successCount < 1 {
		t.Errorf("Expected at least 1 successful get, got %d", successCount)
	}
	if successCount+notFoundCount != numRequests {
		t.Errorf("Expected all requests to be either 200 or 404, got %d success + %d not found = %d (expected %d)",
			successCount, notFoundCount, successCount+notFoundCount, numRequests)
	}
}

func TestHandler_ConcurrentCreateAndGet(t *testing.T) {
	store := newTestStorage()
	defer store.Close()
	h := NewHandler(store, defaultServerConfig, fstest.MapFS{}, testLogger())

	srv := h.Handler()

	numCreates := 50
	ids := createSecretsForTest(t, srv, numCreates)
	verifySecretsReadable(t, srv, ids)
}

func createSecretsForTest(t *testing.T, srv http.Handler, numCreates int) []string {
	t.Helper()
	var wg sync.WaitGroup
	createdIDs := make(chan string, numCreates)

	wg.Add(numCreates)
	for i := range numCreates {
		go func(idx int) {
			defer wg.Done()

			data := base64.StdEncoding.EncodeToString(fmt.Appendf(nil, "data%d", idx))
			reqBody := fmt.Sprintf(`{"data":"%s","validForSeconds":3600,"singleUse":false}`, data)
			req := httptest.NewRequestWithContext(context.Background(),
				http.MethodPost, "/api/secret", strings.NewReader(reqBody))
			req.Header.Set("Content-Type", "application/json")
			w := httptest.NewRecorder()

			srv.ServeHTTP(w, req)

			if w.Code == http.StatusCreated {
				var resp model.CreateSecretResponse
				_ = json.NewDecoder(w.Body).Decode(&resp)
				createdIDs <- resp.ID
			}
		}(i)
	}

	wg.Wait()
	close(createdIDs)

	ids := make([]string, 0, numCreates)
	for id := range createdIDs {
		ids = append(ids, id)
	}

	if len(ids) != numCreates {
		t.Fatalf("Expected %d created secrets, got %d", numCreates, len(ids))
	}
	return ids
}

func verifySecretsReadable(t *testing.T, srv http.Handler, ids []string) {
	t.Helper()
	var wg sync.WaitGroup
	results := make(chan int, len(ids))
	wg.Add(len(ids))

	for _, id := range ids {
		go func(id string) {
			defer wg.Done()
			req := httptest.NewRequestWithContext(context.Background(),
				http.MethodGet, "/api/secret/"+id, nil)
			w := httptest.NewRecorder()
			srv.ServeHTTP(w, req)
			results <- w.Code
		}(id)
	}

	wg.Wait()
	close(results)

	successCount := 0
	for code := range results {
		if code == http.StatusOK {
			successCount++
		}
	}

	if successCount != len(ids) {
		t.Errorf("Expected %d successful gets, got %d", len(ids), successCount)
	}
}
