/**/ 'use strict';
/**/ void function() { /**/

  var increment = 1;

  Jinkela.html = function() {
    var i, n;
    var div = document.createElement('div');
    var template = arguments[0];
    var html = template[0];
    for (i = 1; i < template.length; i++) {
      html += arguments.length > i ? arguments[i] + template[i] : template[i];
    }
    div.innerHTML = html;

    var ins = Object.create(Jinkela.prototype, { element: { value: div, configurable: true } });
    Jinkela.call(ins);

    var styleTagList = div.getElementsByTagName('style');
    var length = styleTagList.length;
    if (length) {
      var classId = 'html-temp-' + increment++;
      ins.element.setAttribute('jinkela-class', classId);
      var cssPreprocessor = Jinkela.cssPreprocessor;
      for (i = 0; i < length; i++) {
        for (n = styleTagList[i].firstChild; n; n = n.nextSibling) {
          n.data = n.data.replace(/:scope\b/g, '[jinkela-class="' + classId + '"]');
          if (typeof cssPreprocessor === 'function') n.data = cssPreprocessor(n.data);
        }
      }
    }
    return ins;
  };

/**/ }(); /**/
