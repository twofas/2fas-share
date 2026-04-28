// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

package handler

import (
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io/fs"
	"log/slog"
	"net/http"
	"time"

	"github.com/gorilla/mux"

	"github.com/twofas/2fas-share-server/internal/middleware"
	"github.com/twofas/2fas-share-server/internal/model"
	"github.com/twofas/2fas-share-server/internal/storage"
)

func makeID() string {
	const idSize = 32

	b := make([]byte, idSize)
	_, _ = rand.Read(b)
	return base64.RawURLEncoding.EncodeToString(b)
}

type Handler struct {
	storage  storage.Storage
	nowFunc  func() time.Time
	cfg      Config
	assetsFS fs.FS
	log      *slog.Logger
}

func NewHandler(s storage.Storage, cfg Config, assetsFS fs.FS, log *slog.Logger) *Handler {
	return &Handler{
		storage:  s,
		nowFunc:  time.Now,
		cfg:      cfg,
		assetsFS: assetsFS,
		log:      log,
	}
}

func (h *Handler) SetNowFunc(f func() time.Time) {
	h.nowFunc = f
}

func (h *Handler) CreateSecret(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	r.Body = http.MaxBytesReader(w, r.Body, h.cfg.MaxRequestBodySize)

	var req model.CreateSecretRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		if isMaxBytesError(err) {
			writeError(w, "request body too large", http.StatusBadRequest)
			return
		}
		writeError(w, "invalid request body", http.StatusBadRequest)
		return
	}

	if errMsg := h.validateCreateRequest(&req); errMsg != "" {
		writeError(w, errMsg, http.StatusBadRequest)
		return
	}

	id := makeID()

	now := h.nowFunc().UTC()

	secret := &model.Secret{
		ID:         id,
		Data:       req.Data,
		CreatedAt:  now,
		ValidUntil: now.Add(time.Duration(req.ValidForSeconds) * time.Second),
		SingleUse:  req.SingleUse,
	}

	if err := h.storage.Create(ctx, secret); err != nil {
		h.log.ErrorContext(ctx, "Failed to store secret", "error", err)
		writeError(w, "internal server error", http.StatusInternalServerError)
		return
	}

	resp := model.CreateSecretResponse{
		ID:         secret.ID,
		CreatedAt:  secret.CreatedAt,
		ValidUntil: secret.ValidUntil,
		SingleUse:  secret.SingleUse,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	if err := json.NewEncoder(w).Encode(resp); err != nil {
		h.log.ErrorContext(ctx, "Failed to encode response", "error", err)
	}
}

// validateCreateRequest returns an error message if the request is invalid, or empty string if valid.
func (h *Handler) validateCreateRequest(req *model.CreateSecretRequest) string {
	if req.Data == "" {
		return "data must not be empty"
	}
	if len(req.Data) > h.cfg.MaxDataSize {
		return fmt.Sprintf("data exceeds maximum size of %d bytes", h.cfg.MaxDataSize)
	}
	if _, err := base64.StdEncoding.DecodeString(req.Data); err != nil {
		return "data must be base64 encoded"
	}
	if req.ValidForSeconds <= 0 {
		return "validForSeconds must be positive"
	}
	if req.ValidForSeconds > h.cfg.MaxValidForSeconds {
		return fmt.Sprintf("validForSeconds exceeds maximum of %d", h.cfg.MaxValidForSeconds)
	}
	return ""
}

func (h *Handler) GetSecret(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	vars := mux.Vars(r)
	id := vars["id"]

	secret, err := h.storage.Get(ctx, id)
	if errors.Is(err, storage.ErrNotFound) {
		writeError(w, "secret not found", http.StatusNotFound)
		return
	}
	if err != nil {
		h.log.ErrorContext(ctx, "Failed to retrieve secret", "error", err)
		writeError(w, "internal server error", http.StatusInternalServerError)
		return
	}

	if secret.SingleUse {
		if err := h.storage.Delete(ctx, id); err != nil {
			h.log.ErrorContext(ctx, "Failed to delete single-use secret", "error", err)
			writeError(w, "internal server error", http.StatusInternalServerError)
			return
		}
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(secret); err != nil {
		h.log.ErrorContext(ctx, "Failed to encode response", "error", err)
	}
}

func (h *Handler) Health(w http.ResponseWriter, _ *http.Request) {
	w.WriteHeader(http.StatusOK)
}

// Handler returns an http.Handler with all routes and middleware configured.
// CORS wraps the entire router. Logging applies to all matched routes.
// Throttling applies only to /api/secret endpoints.
func (h *Handler) Handler() http.Handler {
	r := mux.NewRouter()
	r.Use(middleware.Logging(h.log))

	api := r.PathPrefix("/api").Subrouter()
	api.HandleFunc("/health", h.Health).Methods("GET")

	secret := api.PathPrefix("/secret").Subrouter()
	secret.Use(middleware.Throttle(h.cfg.ThrottleConfig, h.log))
	secret.HandleFunc("", h.CreateSecret).Methods("POST")
	secret.HandleFunc("/{id}", h.GetSecret).Methods("GET")
	r.PathPrefix("/").Handler(http.FileServerFS(h.assetsFS))

	return middleware.CORS(r)
}

func writeError(w http.ResponseWriter, msg string, code int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	if err := json.NewEncoder(w).Encode(map[string]string{"error": msg}); err != nil {
		return
	}
}

func isMaxBytesError(err error) bool {
	var maxBytesErr *http.MaxBytesError
	return errors.As(err, &maxBytesErr)
}
