// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

package middleware

import (
	"fmt"
	"log/slog"
	"net/http"

	"golang.org/x/time/rate"
)

// ThrottleConfig holds rate-limiting configuration.
type ThrottleConfig struct {
	AllowedQPS int `env:"HTTP_SERVER_ALLOWED_QPS" env-default:"0"`
	Burst      int `env:"HTTP_SERVER_ALLOWED_BURST" env-default:"0"`
}

func (c ThrottleConfig) Validate() error {
	if c.AllowedQPS < 0 {
		return fmt.Errorf("invalid allowed QPS HTTP_SERVER_ALLOWED_QPS: must be >= 0, got %d", c.AllowedQPS)
	}
	if c.Burst < 0 {
		return fmt.Errorf("invalid allowed burst HTTP_SERVER_ALLOWED_BURST: must be >= 0, got %d", c.Burst)
	}
	return nil
}

// Throttle returns a middleware that rate-limits requests using a token bucket.
// When allowedQPS is 0, the middleware is a no-op (all requests pass through).
// When burst is 0, it defaults to max(1, allowedQPS).
func Throttle(cfg ThrottleConfig, log *slog.Logger) func(http.Handler) http.Handler {
	allowedQPS, burst := cfg.AllowedQPS, cfg.Burst
	if allowedQPS == 0 {
		return func(next http.Handler) http.Handler {
			return next
		}
	}

	if burst == 0 {
		burst = max(1, allowedQPS)
	}

	limiter := rate.NewLimiter(rate.Limit(allowedQPS), burst)

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if !limiter.Allow() {
				log.WarnContext(r.Context(), "Rate limit exceeded",
					"method", r.Method,
					"path", r.URL.Path,
				)
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusTooManyRequests)
				_, _ = w.Write([]byte(`{"error": "Too many requests"}`))
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}
