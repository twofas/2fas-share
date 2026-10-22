.PHONY: help

USERID=$(shell id -u)

.PHONY: go-lint
go-lint:
	go tool -modfile ../go.mod golangci-lint run

.PHONY: go-lint-fix
go-lint-fix:
	go tool -modfile ../go.mod golangci-lint run --fix

format:
	 go tool -modfile ../go.mod golangci-lint fmt
