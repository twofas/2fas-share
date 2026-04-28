// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

package main

import (
	"context"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	awsconfig "github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	awsddb "github.com/aws/aws-sdk-go-v2/service/dynamodb"

	"github.com/twofas/2fas-share-server/internal/config"
	"github.com/twofas/2fas-share-server/internal/handler"
	"github.com/twofas/2fas-share-server/internal/storage"
	"github.com/twofas/2fas-share-server/internal/storage/bbolt"
	dynamodbstorage "github.com/twofas/2fas-share-server/internal/storage/dynamodb"
	"github.com/twofas/2fas-share-server/internal/storage/inmemory"
)

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))

	if err := start(logger); err != nil {
		logger.Error("Application error", "error", err)
		os.Exit(1)
	}
}

func start(log *slog.Logger) error {
	cfg, err := config.Load()
	if err != nil {
		return fmt.Errorf("failed to load configuration: %w", err)
	}

	store, err := newStorage(cfg, log)
	if err != nil {
		return fmt.Errorf("failed to create storage: %w", err)
	}
	defer func() {
		if err := store.Close(); err != nil {
			log.Error("Failed to close storage", "error", err)
		}
	}()

	frontendFS := os.DirFS(cfg.FrontendDir)
	log.Info("Serving frontend", "dir", cfg.FrontendDir)
	h := handler.NewHandler(store, cfg.Config, frontendFS, log)

	srv := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      h.Handler(),
		ReadTimeout:  cfg.ReadTimeout,
		WriteTimeout: cfg.WriteTimeout,
		IdleTimeout:  60 * time.Second,
	}

	serverErr := make(chan error, 1)
	go func() {
		log.Info("Starting server", "port", cfg.Port, "storage_backend", cfg.StorageBackend)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			serverErr <- fmt.Errorf("server error: %w", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	select {
	case err := <-serverErr:
		return err
	case <-quit:
	}

	log.Info("Shutting down server")

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		return fmt.Errorf("server forced to shutdown: %w", err)
	}

	log.Info("Server stopped")
	return nil
}

func newStorage(cfg *config.Config, log *slog.Logger) (storage.Storage, error) {
	switch cfg.StorageBackend {
	case config.BackendInMemory:
		return inmemory.New(cfg.InMemory), nil
	case config.BackendBBolt:
		store, err := bbolt.New(cfg.BBolt, log)
		if err != nil {
			return nil, fmt.Errorf("failed to create bbolt storage: %w", err)
		}
		return store, nil
	case config.BackendDynamoDB:
		client, err := newDynamoDBClient(cfg.DynamoDB)
		if err != nil {
			return nil, fmt.Errorf("failed to create dynamodb storage: %w", err)
		}
		return dynamodbstorage.New(client, cfg.DynamoDB.TableName), nil
	default:
		return nil, fmt.Errorf("unknown storage backend: %s", cfg.StorageBackend)
	}
}

func newDynamoDBClient(cfg dynamodbstorage.Config) (*awsddb.Client, error) {
	ctx := context.Background()

	opts := []func(*awsconfig.LoadOptions) error{
		awsconfig.WithRegion(cfg.Region),
	}
	var clientOpts []func(*awsddb.Options)

	if cfg.Endpoint != "" {
		opts = append(opts, awsconfig.WithCredentialsProvider(
			credentials.NewStaticCredentialsProvider("test", "test", ""),
		))
		clientOpts = append(clientOpts, func(o *awsddb.Options) {
			o.BaseEndpoint = aws.String(cfg.Endpoint)
		})
	}

	awsCfg, err := awsconfig.LoadDefaultConfig(ctx, opts...)
	if err != nil {
		return nil, fmt.Errorf("failed to load AWS config: %w", err)
	}

	return awsddb.NewFromConfig(awsCfg, clientOpts...), nil
}
