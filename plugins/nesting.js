Jinkela.cssPreprocessor = function(styleSheet) {
  // Remove comments
  styleSheet = styleSheet.replace(/\/\*[\s\S]*?\*\//g, '');
  // Store special blocks
  var stringStorage = [];
  var atBlockStorage = [];
  styleSheet = styleSheet.replace(/(["'])([\s\S]*?)(\1)/g, function($0) {
    return '<string>' + stringStorage.push($0) + '<\/string>';
  }).replace(/@[^{}]+\{([^{}]+\{[^{}]*\})*\s*\}/g, function($0) {
    return '<atBlock>' + atBlockStorage.push($0) + '<\/atBlock>';
  });
  // Flatten
  var tmp;
  while (tmp !== styleSheet) {
    styleSheet = (tmp = styleSheet).replace(/(([^{};]+)\{[^}]*?)([^{};]+\{[^}]*?\})/, '$2 $3$1');
  }
  styleSheet = styleSheet.replace(/\s+&/g, '');
  // Reset special blocks
  styleSheet = styleSheet.replace(/<atBlock>(\d+)<\/atBlock>/g, function($0, $1) {
    return atBlockStorage[$1 - 1];
  }).replace(/<string>(\d+)<\/string>/g, function($0, $1) {
    return stringStorage[$1 - 1];
  });
  return styleSheet;
};
