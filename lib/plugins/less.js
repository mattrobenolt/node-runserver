var path = require('path');

exports.resolver = function(options) {
    return function sass_resolver(files, cb) {
        var possibilities = [];
        files.forEach(function(file) {
            if ( /\.css$/i.test(file) ) {
                // if it's a .css file, append on a .less version.
                possibilities.push(file.replace('.css', '.less'));
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
    var less = require('less');
    return function less_preprocessor(file, original, raw, cb) {
        console.log('less preprocessor', path.extname(original));
        if (path.extname(original) !== '.less') return cb(null, false);

        new(less.Parser)({optimization:2}).parse(raw, function(err, tree) {
            var css;
            try {
                css = tree.toCSS();
            } catch(e) {
                console.error();
                console.error('Less compiling error:'.red.bold);
                css = ['  ' + e.type + ' ' + e.message];
                e.extract.forEach(function(line){
                    if(!line) return;
                    css.push('    ' + line);
                });
                css = css.join('\n').red.bold;
                console.error(css);
            }
            cb(null, css);
        });
    };
};
