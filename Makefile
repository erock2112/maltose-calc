.PHONY: test
test: package-lock.json
	npm test

.PHONY: test-watch
test-watch: package-lock.json
	npm run test:watch

.PHONY: lint
lint: package-lock.json
	./node_modules/.bin/eslint ./src ./test

package-lock.json: package.json
	npm install
