Object.defineProperty(Jinkela, 'from', {
  configurable: true,
  value: function(raw) {
    if (raw instanceof Array) {
      var result = [];
      for (var i = 0; i < raw.length; i++) result.push(new this(raw[i]));
      var to = function(target) {
        for (var i = 0; i < raw.length; i++) result[i].to(target);
        return this;
      };
      Object.defineProperty(result, 'renderTo', { configurable: true, value: to });
      Object.defineProperty(result, 'to', { configurable: true, value: to });
      return result;
    } else {
      return new this(raw);
    }
  }
});
