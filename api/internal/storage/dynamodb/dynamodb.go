// SPDX-License-Identifier: GPL-3.0-only
//
// Copyright © 2026 Two Factor Authentication Service, Inc.
//
// Licensed under the GNU General Public License v3.0.
// See the LICENSE file for details.

package dynamodb

import (
	"context"
	"encoding/json"
	"fmt"
	"strconv"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	awsddb "github.com/aws/aws-sdk-go-v2/service/dynamodb"
	ddbtypes "github.com/aws/aws-sdk-go-v2/service/dynamodb/types"

	"github.com/twofas/2fas-share-server/internal/model"
	"github.com/twofas/2fas-share-server/internal/storage"
)

// Config holds configuration for the DynamoDB storage backend.
type Config struct {
	TableName string `env:"DYNAMODB_TABLE_NAME" env-default:"secrets"`
	Region    string `env:"DYNAMODB_REGION" env-default:"us-east-1"`
	Endpoint  string `env:"DYNAMODB_ENDPOINT"`
}

func (c Config) Validate() error {
	if c.TableName == "" {
		return fmt.Errorf("invalid table name DYNAMODB_TABLE_NAME: must not be empty, got %q", c.TableName)
	}
	if c.Region == "" {
		return fmt.Errorf("invalid region DYNAMODB_REGION: must not be empty, got %q", c.Region)
	}
	return nil
}

// Storage implements storage.Storage interface using DynamoDB.
type Storage struct {
	client    *awsddb.Client
	tableName string
}

// New creates a new DynamoDB storage backed by the provided client.
func New(client *awsddb.Client, tableName string) *Storage {
	return &Storage{
		client:    client,
		tableName: tableName,
	}
}

func (s *Storage) Create(ctx context.Context, secret *model.Secret) error {
	if time.Until(secret.ValidUntil) <= 0 {
		return nil
	}

	data, err := json.Marshal(secret)
	if err != nil {
		return fmt.Errorf("failed to marshal secret: %w", err)
	}

	_, err = s.client.PutItem(ctx, &awsddb.PutItemInput{
		TableName: aws.String(s.tableName),
		Item: map[string]ddbtypes.AttributeValue{
			"id":          &ddbtypes.AttributeValueMemberS{Value: secret.ID},
			"valid_until": &ddbtypes.AttributeValueMemberN{Value: strconv.FormatInt(secret.ValidUntil.Unix(), 10)},
			"data":        &ddbtypes.AttributeValueMemberS{Value: string(data)},
		},
	})
	if err != nil {
		return fmt.Errorf("failed to put DynamoDB item: %w", err)
	}

	return nil
}

func (s *Storage) Get(ctx context.Context, id string) (*model.Secret, error) {
	result, err := s.client.GetItem(ctx, &awsddb.GetItemInput{
		TableName: aws.String(s.tableName),
		Key: map[string]ddbtypes.AttributeValue{
			"id": &ddbtypes.AttributeValueMemberS{Value: id},
		},
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get DynamoDB item: %w", err)
	}

	if result.Item == nil {
		return nil, storage.ErrNotFound
	}

	dataAttr, ok := result.Item["data"]
	if !ok {
		return nil, fmt.Errorf("failed to read DynamoDB item: missing 'data' attribute")
	}

	dataStr, ok := dataAttr.(*ddbtypes.AttributeValueMemberS)
	if !ok {
		return nil, fmt.Errorf("failed to read DynamoDB item: unexpected type for 'data' attribute")
	}

	var secret model.Secret
	if err := json.Unmarshal([]byte(dataStr.Value), &secret); err != nil {
		return nil, fmt.Errorf("failed to unmarshal DynamoDB data: %w", err)
	}

	// DynamoDB TTL deletion is eventually consistent, so check expiry client-side.
	if time.Now().After(secret.ValidUntil) {
		return nil, storage.ErrNotFound
	}

	return &secret, nil
}

func (s *Storage) Delete(ctx context.Context, id string) error {
	_, err := s.client.DeleteItem(ctx, &awsddb.DeleteItemInput{
		TableName: aws.String(s.tableName),
		Key: map[string]ddbtypes.AttributeValue{
			"id": &ddbtypes.AttributeValueMemberS{Value: id},
		},
	})
	if err != nil {
		return fmt.Errorf("failed to delete DynamoDB item: %w", err)
	}

	return nil
}

func (s *Storage) Close() error {
	return nil
}
