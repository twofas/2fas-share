// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

package main

// Use this small script to check if 2fas-pass-server is running and responding to pings.
// It is needed for the HEALTHCHECK instruction in the dockerfile. Since we are
// distroless image, we can't use curl or wget there.

import (
	"fmt"
	"net/http"
	"os"
)

func main() {
	port, ok := os.LookupEnv("PORT")
	if !ok {
		port = "8080"
	}

	resp, err := http.Get("http://localhost:" + port + "/api/health") //nolint:noctx
	if err != nil {
		fmt.Printf("Health check failed: %v\n", err) //nolint:forbidigo
		os.Exit(1)
	}
	if resp.StatusCode != http.StatusOK {
		fmt.Printf("Health check failed: %v\n", resp.Status) //nolint:forbidigo
		os.Exit(1)
	}
}
