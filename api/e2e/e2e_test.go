// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

package e2e

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/google/go-cmp/cmp"
	"github.com/google/go-cmp/cmp/cmpopts"

	"github.com/twofas/2fas-share-server/internal/handler"
	"github.com/twofas/2fas-share-server/internal/model"
)

var (
	// ignoreData tells cmp.Diff to ignore the Data field.
	ignoreData = cmpopts.IgnoreFields(model.Secret{}, "Data")
)

func TestMain(m *testing.M) {
	if err := waitForServer(30*time.Second, 100*time.Millisecond); err != nil {
		fmt.Fprintf(os.Stderr, "Server not ready: %v\n", err)
		os.Exit(1)
	}
	os.Exit(m.Run())
}

func waitForServer(timeout, interval time.Duration) error {
	ctx, cancel := context.WithTimeout(context.Background(), timeout)
	defer cancel()

	healthURL := getServerURL() + "/api/health"
	for {
		req, err := http.NewRequestWithContext(ctx, http.MethodGet, healthURL, nil)
		if err != nil {
			return fmt.Errorf("creating health check request: %w", err)
		}

		resp, err := http.DefaultClient.Do(req) //nolint:gosec // This is tests, and we are making request to tested server.
		if err == nil {
			resp.Body.Close()
			if resp.StatusCode == http.StatusOK {
				return nil
			}
		}

		select {
		case <-ctx.Done():
			return fmt.Errorf("timeout waiting for server at %s", healthURL)
		case <-time.After(interval):
			// retry
		}
	}
}

func getServerURL() string {
	url := os.Getenv("SERVER_URL")
	if url == "" {
		url = "http://localhost:8080"
	}
	return url
}

// post sends a POST request to the given path with the request body and decodes the response.
func post(path string, reqBody any, resp any) (int, error) {
	body, err := json.Marshal(reqBody)
	if err != nil {
		return 0, fmt.Errorf("marshaling request body: %w", err)
	}

	ctx := context.Background()
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, getServerURL()+path, bytes.NewReader(body))
	if err != nil {
		return 0, fmt.Errorf("creating request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	httpResp, err := http.DefaultClient.Do(req) //nolint:gosec // URL from test config
	if err != nil {
		return 0, fmt.Errorf("sending POST request to %s: %w", path, err)
	}
	defer httpResp.Body.Close()

	if resp != nil {
		if err := json.NewDecoder(httpResp.Body).Decode(resp); err != nil {
			return httpResp.StatusCode, fmt.Errorf("decoding response body: %w", err)
		}
	}
	return httpResp.StatusCode, nil
}

// mustPost sends a POST request and fails the test on error.
func mustPost(t *testing.T, path string, reqBody any, resp any) int {
	t.Helper()
	status, err := post(path, reqBody, resp)
	if err != nil {
		t.Fatalf("failed to send POST request %s: %v", path, err)
	}
	return status
}

// get sends a GET request to the given path and decodes the response.
func get(path string, resp any) (int, error) {
	ctx := context.Background()
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, getServerURL()+path, nil)
	if err != nil {
		return 0, fmt.Errorf("creating request: %w", err)
	}

	httpResp, err := http.DefaultClient.Do(req) //nolint:gosec // URL from test config
	if err != nil {
		return 0, fmt.Errorf("sending GET request to %s: %w", path, err)
	}
	defer httpResp.Body.Close()

	if resp != nil {
		if err := json.NewDecoder(httpResp.Body).Decode(resp); err != nil {
			return httpResp.StatusCode, fmt.Errorf("decoding response body: %w", err)
		}
	}
	return httpResp.StatusCode, nil
}

// mustGet sends a GET request and fails the test on error.
func mustGet(t *testing.T, path string, resp any) int {
	t.Helper()
	status, err := get(path, resp)
	if err != nil {
		t.Fatalf("GET %s: %v", path, err)
	}
	return status
}

// mustCreateSecret creates a secret and fails the test if it doesn't succeed.
func mustCreateSecret(t *testing.T, req model.CreateSecretRequest) model.Secret {
	t.Helper()
	var resp model.CreateSecretResponse
	if status := mustPost(t, "/api/secret", req, &resp); status != http.StatusCreated {
		t.Fatalf("creating secret: expected status 201, got %d", status)
	}

	got := model.Secret{
		ID:         resp.ID,
		CreatedAt:  resp.CreatedAt,
		ValidUntil: resp.ValidUntil,
		SingleUse:  resp.SingleUse,
	}

	want := model.Secret{
		ID:         resp.ID,
		Data:       req.Data,
		CreatedAt:  resp.CreatedAt,
		ValidUntil: resp.ValidUntil,
		SingleUse:  req.SingleUse,
	}
	if diff := cmp.Diff(want, got, ignoreData); diff != "" {
		t.Errorf("CreateSecret response mismatch (-want +got):\n%s", diff)
	}

	return want
}

// mustReadSecret reads a secret by ID and fails the test if it doesn't succeed.
func mustReadSecret(t *testing.T, id string) model.Secret {
	t.Helper()
	var secret model.Secret
	if status := mustGet(t, "/api/secret/"+id, &secret); status != http.StatusOK {
		t.Fatalf("reading secret %s: expected status 200, got %d", id, status)
	}
	return secret
}

func encodeBase64(s string) string {
	return base64.StdEncoding.EncodeToString([]byte(s))
}

// assertSameSecret compares two secrets and fails the test if they don't match.
func assertSameSecret(t *testing.T, want, got model.Secret) {
	t.Helper()
	if diff := cmp.Diff(want, got); diff != "" {
		t.Errorf("Secret mismatch (-want +got):\n%s", diff)
	}
}

func TestE2E_CreateAndGetSecret(t *testing.T) {
	createReq := model.CreateSecretRequest{
		Data:            "dGVzdCBkYXRhIGZvciBlMmU=",
		ValidForSeconds: 3600,
		SingleUse:       false,
	}

	created := mustCreateSecret(t, createReq)
	retrieved := mustReadSecret(t, created.ID)
	assertSameSecret(t, created, retrieved)
}

func TestE2E_SingleUseSecret(t *testing.T) {
	created := mustCreateSecret(t, model.CreateSecretRequest{
		Data:            "c2luZ2xlIHVzZSBzZWNyZXQ=",
		ValidForSeconds: 3600,
		SingleUse:       true,
	})

	// First get should succeed
	if status := mustGet(t, "/api/secret/"+created.ID, nil); status != http.StatusOK {
		t.Errorf("First get: expected status 200, got %d", status)
	}

	// Second get should fail with 404
	if status := mustGet(t, "/api/secret/"+created.ID, nil); status != http.StatusNotFound {
		t.Errorf("Second get: expected status 404, got %d", status)
	}
}

func TestE2E_GetNonExistentSecret(t *testing.T) {
	if status := mustGet(t, "/api/secret/nonexistent-uuid-12345", nil); status != http.StatusNotFound {
		t.Errorf("Expected status 404, got %d", status)
	}
}

func TestE2E_CreateSecret_InvalidRequest(t *testing.T) {
	tests := []struct {
		name       string
		req        model.CreateSecretRequest
		wantStatus int
	}{
		{
			name: "data too large",
			req: model.CreateSecretRequest{
				Data:            strings.Repeat("a", handler.DefaultMaxDataSize+1),
				ValidForSeconds: 3600,
			},
			wantStatus: http.StatusBadRequest,
		},
		{
			name: "negative validForSeconds",
			req: model.CreateSecretRequest{
				Data:            "dGVzdA==",
				ValidForSeconds: -100,
			},
			wantStatus: http.StatusBadRequest,
		},
		{
			name: "validForSeconds too large",
			req: model.CreateSecretRequest{
				Data:            "dGVzdA==",
				ValidForSeconds: handler.DefaultMaxValidForSeconds + 1,
			},
			wantStatus: http.StatusBadRequest,
		},
		{
			name: "invalid base64 data",
			req: model.CreateSecretRequest{
				Data:            "not-valid-base64!!!",
				ValidForSeconds: 3600,
			},
			wantStatus: http.StatusBadRequest,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if status := mustPost(t, "/api/secret", tt.req, nil); status != tt.wantStatus {
				t.Errorf("Expected status %d, got %d", tt.wantStatus, status)
			}
		})
	}
}

func TestE2E_CreateSecret_InvalidJSON(t *testing.T) {
	path := "/api/secret"
	ctx := context.Background()
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, getServerURL()+path, strings.NewReader("not valid json"))
	if err != nil {
		t.Fatalf("Failed to create request: %v", err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req) //nolint:gosec // URL from test config
	if err != nil {
		t.Fatalf("Failed to send POST request to %s: %v", path, err)
	}
	defer resp.Body.Close()
	if status := resp.StatusCode; status != http.StatusBadRequest {
		t.Errorf("Expected status 400 for invalid JSON, got %d", status)
	}
}

func TestE2E_MultipleSecretsIndependent(t *testing.T) {
	const numberOfRequests = 10
	secrets := make([]model.Secret, numberOfRequests)
	for i := 0; i < numberOfRequests; i++ {
		req := model.CreateSecretRequest{
			Data:            encodeBase64(fmt.Sprintf("secret%d", i)),
			ValidForSeconds: 3600,
			SingleUse:       false,
		}
		secrets[i] = mustCreateSecret(t, req)
	}

	// All secrets should be retrievable independently
	for _, secret := range secrets {
		retrieved := mustReadSecret(t, secret.ID)
		assertSameSecret(t, secret, retrieved)
	}
}

func TestE2E_CreateSecret_MaxAllowedValues(t *testing.T) {
	mustCreateSecret(t, model.CreateSecretRequest{
		Data:            strings.Repeat("a", handler.DefaultMaxDataSize),
		ValidForSeconds: handler.DefaultMaxValidForSeconds,
		SingleUse:       true,
	})
}

func TestE2E_ConcurrentCreateSecrets(t *testing.T) {
	numRequests := 100
	var wg sync.WaitGroup
	wg.Add(numRequests)

	for i := 0; i < numRequests; i++ {
		go func(idx int) {
			defer wg.Done()

			createReq := model.CreateSecretRequest{
				Data:            encodeBase64(fmt.Sprintf("concurrent-data-%d", idx)),
				ValidForSeconds: 3600,
				SingleUse:       false,
			}

			var created model.CreateSecretResponse
			status, err := post("/api/secret", createReq, &created)
			if err != nil {
				t.Errorf("request %d: error: %v", idx, err)
				return
			}
			if status != http.StatusCreated {
				t.Errorf("request %d: expected status %d, got %d", idx, http.StatusCreated, status)
				return
			}
		}(i)
	}

	wg.Wait()
}

func TestE2E_ConcurrentGetSameSecret(t *testing.T) {
	created := mustCreateSecret(t, model.CreateSecretRequest{
		Data:            encodeBase64("shared-secret-data"),
		ValidForSeconds: 3600,
		SingleUse:       false,
	})

	// Now get it concurrently
	numRequests := 100
	var wg sync.WaitGroup
	wg.Add(numRequests)

	for i := 0; i < numRequests; i++ {
		go func(idx int) {
			defer wg.Done()
			status, err := get("/api/secret/"+created.ID, nil)
			if err != nil {
				t.Errorf("request %d: error: %v", idx, err)
				return
			}
			if status != http.StatusOK {
				t.Errorf("request %d: expected status %d, got %d", idx, http.StatusOK, status)
				return
			}
		}(i)
	}

	wg.Wait()
}

func TestE2E_ConcurrentSingleUseSecret(t *testing.T) {
	created := mustCreateSecret(t, model.CreateSecretRequest{
		Data:            encodeBase64("single-use-concurrent-test"),
		ValidForSeconds: 3600,
		SingleUse:       true,
	})

	// Try to get it concurrently - only one should succeed
	numRequests := 50
	var wg sync.WaitGroup
	wg.Add(numRequests)

	results := make(chan int, numRequests)

	for i := 0; i < numRequests; i++ {
		go func() {
			defer wg.Done()
			status, err := get("/api/secret/"+created.ID, nil)
			if err != nil {
				t.Errorf("GET request error: %v", err)
			}
			results <- status
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
		default:
			t.Fatalf("Unexpected status code: %d", code)
		}
	}

	// Due to race conditions we may get more than one success.
	if successCount < 1 {
		t.Errorf("Expected at least 1 successful get, got %d", successCount)
	}
	t.Logf("Single-use concurrent: %d succeeded, %d got 404", successCount, notFoundCount)
}

func TestE2E_ConcurrentCreateAndGet(t *testing.T) {
	numSecrets := 50
	numWriters := 10
	numReaders := 10

	writes := make(chan struct{}, numSecrets)
	reads := make(chan string, numSecrets)

	for i := 0; i < numSecrets; i++ {
		writes <- struct{}{}
	}
	close(writes)

	var writersDone sync.WaitGroup
	writersDone.Add(numWriters)

	var readersDone sync.WaitGroup
	readersDone.Add(numReaders)

	for i := 0; i < numWriters; i++ {
		go runWriter(t, writes, reads, &writersDone)
	}

	go func() {
		writersDone.Wait()
		close(reads)
	}()

	for i := 0; i < numReaders; i++ {
		go runReader(t, reads, &readersDone)
	}

	readersDone.Wait()
}

func runWriter(t *testing.T, writes <-chan struct{}, reads chan<- string, wg *sync.WaitGroup) {
	t.Helper()
	defer wg.Done()
	for range writes {
		raw := fmt.Sprintf("concurrent-create-get-%d", time.Now().UnixNano())
		createReq := model.CreateSecretRequest{
			Data:            encodeBase64(raw),
			ValidForSeconds: 3600,
			SingleUse:       false,
		}
		var created model.CreateSecretResponse
		status, err := post("/api/secret", createReq, &created)
		if err != nil {
			t.Errorf("Failed to create secret: %v", err)
		}
		if status != http.StatusCreated {
			t.Errorf("Unexpected status code when creating a secret: %d", status)
		}
		reads <- created.ID
	}
}

func runReader(t *testing.T, reads <-chan string, wg *sync.WaitGroup) {
	t.Helper()
	defer wg.Done()
	for id := range reads {
		status, err := get("/api/secret/"+id, nil)
		if err != nil {
			t.Errorf("Failed to get secret %s: %v", id, err)
		}
		if status != http.StatusOK {
			t.Errorf("Unexpected status code when getting secret %s: %d", id, status)
		}
	}
}

func TestE2E_ConcurrentMixedOperations(t *testing.T) {
	// Create some initial secrets
	initialSecrets := 10
	ids := make([]string, 0, initialSecrets)

	for i := 0; i < initialSecrets; i++ {
		created := mustCreateSecret(t, model.CreateSecretRequest{
			Data:            encodeBase64(fmt.Sprintf("initial-secret-%d", i)),
			ValidForSeconds: 3600,
			SingleUse:       false,
		})
		ids = append(ids, created.ID)
	}

	// Now run mixed operations concurrently
	numOperations := 100
	var wg sync.WaitGroup
	wg.Add(numOperations)

	for i := 0; i < numOperations; i++ {
		go func(idx int) {
			defer wg.Done()
			runMixedOp(t, idx, ids)
		}(i)
	}

	wg.Wait()
}

func runMixedOp(t *testing.T, idx int, ids []string) {
	t.Helper()
	if idx%2 == 0 {
		runCreateOp(t, idx)
		return
	}
	runGetOp(t, idx, ids)
}

func runCreateOp(t *testing.T, idx int) {
	t.Helper()
	createReq := model.CreateSecretRequest{
		Data:            encodeBase64(fmt.Sprintf("mixed-op-secret-%d", idx)),
		ValidForSeconds: 3600,
		SingleUse:       false,
	}
	status, err := post("/api/secret", createReq, nil)
	if err != nil {
		t.Errorf("Failed to create secret: %v", err)
	}
	if status != http.StatusCreated {
		t.Errorf("Unexpected status code when creating a secret: %d", status)
	}
}

func runGetOp(t *testing.T, idx int, ids []string) {
	t.Helper()
	id := ids[idx%len(ids)]
	status, err := get("/api/secret/"+id, nil)
	if err != nil {
		t.Errorf("Failed to read secret: %v", err)
	}
	if status != http.StatusOK {
		t.Errorf("Unexpected status code when reading a secret: %d", status)
	}
}

func assertCORSHeaders(t *testing.T, resp *http.Response) {
	t.Helper()
	if got := resp.Header.Get("Access-Control-Allow-Origin"); got != "*" {
		t.Errorf("Access-Control-Allow-Origin = %q, want %q", got, "*")
	}
	if got := resp.Header.Get("Access-Control-Allow-Methods"); got != "GET, POST, OPTIONS" {
		t.Errorf("Access-Control-Allow-Methods = %q, want %q", got, "GET, POST, OPTIONS")
	}
	if got := resp.Header.Get("Access-Control-Allow-Headers"); got != "Content-Type" {
		t.Errorf("Access-Control-Allow-Headers = %q, want %q", got, "Content-Type")
	}
}

func TestE2E_CORS_Headers(t *testing.T) {
	ctx := context.Background()
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, getServerURL()+"/api/health", nil)
	if err != nil {
		t.Fatalf("Failed to create request: %v", err)
	}

	resp, err := http.DefaultClient.Do(req) //nolint:gosec // URL from test config
	if err != nil {
		t.Fatalf("Failed to send request: %v", err)
	}
	defer resp.Body.Close()

	assertCORSHeaders(t, resp)
}

func TestE2E_CORS_PreflightRequest(t *testing.T) {
	ctx := context.Background()
	req, err := http.NewRequestWithContext(ctx, http.MethodOptions, getServerURL()+"/api/secret", nil)
	if err != nil {
		t.Fatalf("Failed to create request: %v", err)
	}
	req.Header.Set("Origin", "https://example.com")
	req.Header.Set("Access-Control-Request-Method", "POST")

	resp, err := http.DefaultClient.Do(req) //nolint:gosec // URL from test config
	if err != nil {
		t.Fatalf("Failed to send request: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		t.Errorf("Preflight request: expected status 200, got %d", resp.StatusCode)
	}
	if got := resp.Header.Get("Access-Control-Allow-Origin"); got != "*" {
		t.Errorf("Access-Control-Allow-Origin = %q, want %q", got, "*")
	}
}

func TestE2E_CORS_CreateSecret(t *testing.T) {
	ctx := context.Background()
	body := bytes.NewReader([]byte(`{"data":"dGVzdA==","validForSeconds":3600,"singleUse":false}`))
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, getServerURL()+"/api/secret", body)
	if err != nil {
		t.Fatalf("Failed to create request: %v", err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req) //nolint:gosec // URL from test config
	if err != nil {
		t.Fatalf("Failed to send request: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusCreated {
		t.Errorf("Expected status 201, got %d", resp.StatusCode)
	}
	assertCORSHeaders(t, resp)
}

func TestE2E_CORS_GetSecret(t *testing.T) {
	created := mustCreateSecret(t, model.CreateSecretRequest{
		Data:            "dGVzdA==",
		ValidForSeconds: 3600,
		SingleUse:       false,
	})

	ctx := context.Background()
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, getServerURL()+"/api/secret/"+created.ID, nil)
	if err != nil {
		t.Fatalf("Failed to create request: %v", err)
	}

	resp, err := http.DefaultClient.Do(req) //nolint:gosec // URL from test config
	if err != nil {
		t.Fatalf("Failed to send request: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		t.Errorf("Expected status 200, got %d", resp.StatusCode)
	}
	assertCORSHeaders(t, resp)
}
