.PHONY: help

USERID=$(shell id -u)

.PHONY: api-licenses
api-licenses:
	cd api; \
	go tool -modfile ../go.mod go-licenses report github.com/twofas/2fas-share-server --ignore github.com/twofas/2fas-share-server --ignore golang.org/x/sys/unix --template licenses.tpl > licenses.json; \
	cat licenses.json | jq 'sort_by(.package)' > tmp.json && mv tmp.json licenses.json;

.PHONY: license-headers-fix
license-headers-fix:
	go tool addlicense -f license_header.txt \
         -ignore '.github/**' \
         -ignore '.idea/**' \
         -ignore 'api/docker-compose*.yml' \
         -ignore 'docker-compose*.yml' \
         -ignore 'frontend/.pnp.loader.mjs' \
         -ignore 'frontend/.yarn/**' \
         -ignore 'frontend/2fas-share-frontend/eslint.config.mjs' \
         -ignore 'frontend/dist/**' \
         -ignore 'frontend/open-source-licenses.html' \
         .

.PHONY: check-license-headers
check-license-headers:
	go tool addlicense -check -f license_header.txt \
         -ignore '.github/**' \
         -ignore '.idea/**' \
         -ignore 'api/docker-compose*.yml' \
         -ignore 'docker-compose*.yml' \
         -ignore 'frontend/.pnp.loader.mjs' \
         -ignore 'frontend/.yarn/**' \
         -ignore 'frontend/2fas-share-frontend/eslint.config.mjs' \
         -ignore 'frontend/dist/**' \
         -ignore 'frontend/open-source-licenses.html' \
         .
