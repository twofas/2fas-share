# 2FAS Share Server

A server for securely sharing secrets with expiration support.

## Quick Start

To run using BBolt backend use:

```bash
docker compose up
```

This starts the server on port 8080 with BBolt storage, persisting data to `./data/`.

To change the host directory for the database file:

```bash
BBOLT_HOST_DIR=/path/to/data docker compose up
```

## Environment Variables

### Core

| Variable | Description | Default |
|---|---|---|
| `PORT` | HTTP server listen port | `8080` |

### Server Limits

| Variable | Description | Default |
|---|---|---|
| `READ_TIMEOUT` | Maximum duration for reading the entire request (Go duration format, e.g. `5s`) | `3s` |
| `WRITE_TIMEOUT` | Maximum duration for writing the response (Go duration format) | `5s` |
| `MAX_DATA_SIZE` | Maximum size of the secret data payload in bytes | `16384` (16 KB) |
| `MAX_VALID_FOR_SECONDS` | Maximum allowed secret lifetime in seconds | `2592000` (30 days) |
| `MAX_REQUEST_BODY_SIZE` | Maximum allowed HTTP request body size in bytes | `32768` (32 KB) |

### Rate Limiting

| Variable | Description | Default |
|---|---|---|
| `HTTP_SERVER_ALLOWED_QPS` | Maximum allowed queries per second. `0` disables rate limiting | `0` (disabled) |
| `HTTP_SERVER_ALLOWED_BURST` | Maximum burst size for rate limiting. `0` defaults to `HTTP_SERVER_ALLOWED_QPS` | `0` |

### BBolt Backend (`STORAGE_BACKEND=bbolt`)

| Variable | Description | Default |
|---|---|---|
| `BBOLT_CLEANUP_INTERVAL` | How often to scan and remove expired secrets (Go duration format) | `60s` |
