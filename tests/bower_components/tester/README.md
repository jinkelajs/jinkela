## tester
###### A simple web unit tester

#### Usage

Put this code to your testing HTML files.

```js
Tester.feedback( true || false );
```

e.g.

```html
<!-- test-plus.html -->
<script src="bower_components/tester/tester.js"></script>
<script>
var plus = function(a ,b) {
  return a + b;
};

Tester.feedback(plus(1, 2) === 3);
</script>
```

Use `Tester.run` to execute your testing HTML files in a summary file.

```html
<!-- test.html -->
<script src="bower_components/tester/tester.js"></script>
<script>
Tester.run('test-plus.html');
</script>
```

