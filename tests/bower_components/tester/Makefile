build:
	@echo "\\033[1mBuilding\\033[0m ... \c"
	@bower install
	@[ -f ./node_modules/uglify-js/bin/uglifyjs ] || npm install uglify-js
	@cat bower_components/promise.js/promise.js > tester.js
	@cat src/*.js >> tester.js
	@./node_modules/uglify-js/bin/uglifyjs tester.js -o tester.js
	@echo "\\033[32mOK\\033[0m"

tag:
	@\
	version=$$(cat bower.json | grep "version" | awk -F '"' '{print $$4}'); \
	if [ $$(git status -s | wc -l) -gt 0 ]; then \
	  echo "请先打好 commit"; \
	else \
	  git checkout HEAD~0; \
	  sed -i '' '/tester\.js/d' .gitignore; \
	  make build; \
	  git add . -A; \
	  git commit -m $$version; \
	  git tag $$version; \
	fi
