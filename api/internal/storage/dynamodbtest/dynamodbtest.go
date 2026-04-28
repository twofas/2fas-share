// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

// Package dynamodbtest provides test helpers for the DynamoDB storage backend.
package dynamodbtest

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"os"
	"testing"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	awsconfig "github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	ddbtypes "github.com/aws/aws-sdk-go-v2/service/dynamodb/types"

	dynamodbstore "github.com/twofas/2fas-share-server/internal/storage/dynamodb"
)

const defaultEndpoint = "http://localhost:5555"

// NewTestStorageOrSkip creates a DynamoDB-backed storage for testing.
// It creates a temporary table with TTL enabled against a moto instance.
//
// If SKIP_DYNAMODB_TESTS is set, the test is skipped.
// If DynamoDB is not available, the test fails with instructions.
func NewTestStorageOrSkip(t *testing.T) *dynamodbstore.Storage {
	t.Helper()

	if os.Getenv("SKIP_DYNAMODB_TESTS") != "" {
		t.Skip("Skipping DynamoDB tests (SKIP_DYNAMODB_TESTS is set)")
	}

	store, cleanup, err := newTestStorage()
	if err != nil {
		t.Fatalf(`Failed to create DynamoDB storage: %v

Start DynamoDB with: docker compose -f docker-compose.dynamodb.yml up -d

Or skip these tests with: SKIP_DYNAMODB_TESTS=1 go test ./...\n`, err)
	}

	t.Cleanup(cleanup)

	return store
}

func newTestStorage() (*dynamodbstore.Storage, func(), error) {
	endpoint := os.Getenv("DYNAMODB_ENDPOINT")
	if endpoint == "" {
		endpoint = defaultEndpoint
	}

	tableName := fmt.Sprintf("test-%s", randomID())

	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	awsCfg, err := awsconfig.LoadDefaultConfig(ctx,
		awsconfig.WithRegion("us-east-1"),
		awsconfig.WithCredentialsProvider(
			credentials.NewStaticCredentialsProvider("test", "test", ""),
		),
	)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to load AWS config: %w", err)
	}

	client := dynamodb.NewFromConfig(awsCfg, func(o *dynamodb.Options) {
		o.BaseEndpoint = aws.String(endpoint)
	})

	_, err = client.CreateTable(ctx, &dynamodb.CreateTableInput{
		TableName: aws.String(tableName),
		KeySchema: []ddbtypes.KeySchemaElement{
			{AttributeName: aws.String("id"), KeyType: ddbtypes.KeyTypeHash},
		},
		AttributeDefinitions: []ddbtypes.AttributeDefinition{
			{AttributeName: aws.String("id"), AttributeType: ddbtypes.ScalarAttributeTypeS},
		},
		BillingMode: ddbtypes.BillingModePayPerRequest,
	})
	if err != nil {
		return nil, nil, fmt.Errorf("failed to create DynamoDB table: %w", err)
	}

	_, err = client.UpdateTimeToLive(ctx, &dynamodb.UpdateTimeToLiveInput{
		TableName: aws.String(tableName),
		TimeToLiveSpecification: &ddbtypes.TimeToLiveSpecification{
			Enabled:       aws.Bool(true),
			AttributeName: aws.String("valid_until"),
		},
	})
	if err != nil {
		return nil, nil, fmt.Errorf("failed to enable TTL on DynamoDB table: %w", err)
	}

	cleanup := func() {
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		_, _ = client.DeleteTable(ctx, &dynamodb.DeleteTableInput{
			TableName: aws.String(tableName),
		})
	}

	return dynamodbstore.New(client, tableName), cleanup, nil
}

func randomID() string {
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		panic(fmt.Sprintf("failed to generate random ID: %v", err))
	}
	return hex.EncodeToString(b)
}
