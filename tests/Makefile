tests := $(shell find . -name 'test-*.html' -maxdepth 1)

index.html: bower_components $(tests)
	@                                                                                       \
	echo '<script src="bower_components/tester/tester.js"></script>' > index.html;          \
	echo '<script>' >> index.html;                                                          \
	echo 'Tester.run([' >> index.html;                                                      \
	echo "$(tests)\c" | awk -v RS=" " -F "/" '{print "  \""$$2"\","}' >> index.html;        \
	echo ']);' >> index.html;                                                               \
	echo '</script>' >> index.html;                                                         \

bower_components:
	@bower install
