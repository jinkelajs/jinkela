addEventListener('DOMContentLoaded', function() {

  var meta = document.querySelector('meta[name=jinkela]') || {};
  if (/(^|,)\s*auto=(yes|true|1)\s*(,|$)/.test(meta.content)) {
    Jinkela.call(Object.create(window, {
      element: { value: document.documentElement, configurable: true },
      template: { value: document.documentElement.outerHTML, configurable: true }
    }));
  }

});
