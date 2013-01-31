var path = require('path');

exports.resolver = function(options) {
    return function sass_resolver(files, cb) {
        var possibilities = [];
        files.forEach(function(file) {
            if ( /\.css$/i.test(file) ) {
                // if it's a .css file, append on a .scss version.
                possibilities.push(file.replace('.css', '.scss'));
            }
            if (!~possibilities.indexOf(file)) {
                // don't add dupes
                possibilities.push(file);
            }
        });

        return cb(null, possibilities);
    };
};

exports.preprocessor = function(options) {
    var sass = require('node-sass');
    return function sass_preprocessor(file, original, raw, cb) {
        console.log('sass preprocessor', path.extname(original));
        if (path.extname(original) !== '.scss') return cb(null, false);
        console.log('rendering sass');
        sass.render(raw, cb);
    };
};
