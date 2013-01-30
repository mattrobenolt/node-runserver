exports.resolver = function(options) {
    return function sass_resolver(files, cb) {
        var possibilities = [];
        files.forEach(function(file) {
            if ( /\.css$/i.test(file) ) {
                // if it's a .css file, append on a .less version.
                possibilities.push(file.substr(0, file.length-3) + 'less');
            }
            if (!~possibilities.indexOf(file)) {
                // don't add dupes
                possibilities.push(file);
            }
        });

        return cb(null, possibilities);
    };
};
