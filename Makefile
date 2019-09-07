.PHONY: test
test: package-lock.json
	npm test

.PHONY: test-watch
test-watch: package-lock.json
	npm run test:watch

package-lock.json: package.json
	npm install
