.PHONY: test
test: package-lock.json
	./node_modules/karma/bin/karma start

package-lock.json: package.json
	npm install
