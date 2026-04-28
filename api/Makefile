.PHONY: help

USERID=$(shell id -u)

.PHONY: go-lint
go-lint:
	go tool golangci-lint run

.PHONY: go-lint-fix
go-lint-fix:
	go tool golangci-lint run --fix

format:
	 go tool golangci-lint fmt
