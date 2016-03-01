index.html: bower_components
	@                                                                               \
	echo '<script src="bower_components/tester/tester.js"></script>' > index.html;  \
	echo '<script>' >> index.html;                                                  \
	echo 'Tester.run([' >> index.html;                                              \
	find . -name 'test-*.html' | sed -E 's/\.\/(.*)/  "\1",/' >> index.html;        \
	echo ']);' >> index.html;                                                       \
	echo '</script>' >> index.html;                                                 \

bower_components:
	@bower install
