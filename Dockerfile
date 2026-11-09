# SPDX-License-Identifier: BUSL-1.1
#
# Copyright (C) 2025 Two Factor Authentication Service, Inc.
# Licensed under the Business Source License 1.1
# See LICENSE file for full terms

FROM node:22.23.4-alpine@sha256:fe4f6d74e20370acb04ad889077d14d0f64a9c8ea6a42bc60cddf1e844699914 AS frontendbuilder

WORKDIR /frontend

# Copy dependency files first for better cache utilization
COPY frontend/package.json frontend/yarn.lock ./

RUN corepack enable && corepack prepare --activate && yarn install --immutable

# Copy source code after dependencies are cached
COPY frontend .

ARG VITE_UNIVERSAL_LINK_PROTOCOL="twofaspass"

COPY api/licenses.json ../api/licenses.json
RUN yarn build-ci

FROM golang:1.27.3-alpine@sha256:d200d2dd76b03a99b52651fd1325aff7dcd35422c35c01bac56571b0507f3deb AS gobuilder

WORKDIR /go/src/2fas-share

# Copy dependency files first for better cache utilization
COPY api/go.mod api/go.sum ./
RUN go mod download && go mod verify

ARG SOURCE_COMMIT

# Copy source code after dependencies are cached
COPY api .

# Build the application with security flags
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
    -ldflags="-s -w" \
    -o /go/bin/2fas-share-server && \
    cd healthcheck && CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
    -ldflags="-s -w" \
    -o /go/bin/healthcheck

# Use distroless nonroot image for minimal attack surface
FROM gcr.io/distroless/static-debian12:nonroot@sha256:afa5c872c891853ca7fcf1f12c3edb23f7eeef36189728842dd51042ff57f7ab

COPY --from=gobuilder /go/bin/2fas-share-server /
COPY --from=gobuilder /go/bin/healthcheck /
COPY --from=frontendbuilder /frontend/dist /dist

ENV FRONTEND_DIR=/dist
CMD ["/2fas-share-server"]
HEALTHCHECK --interval=5s --timeout=1s --start-period=5s --retries=3 CMD ["/healthcheck"]
