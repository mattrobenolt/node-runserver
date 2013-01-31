var express = require('express'),
    path = require('path'),
    fs = require('fs'),
    async = require('async');

var resolveCacheFile = process.cwd() + '/.runserver_cache.json',
    resolveCache = {};

try {
    resolveCache = require(resolveCacheFile);
    console.log('Loading cache...', resolveCache);
} catch(e) {}

function buildResolvers(resolvers, file) {
    var first = resolvers[0];
    return [function(cb) { first([file], cb); }].concat(resolvers.slice(1));
}

function buildPreprocessors(preprocessors, file, original, raw) {
    console.log(preprocessors);
    var p = [];
    preprocessors.forEach(function(preprocessor) {
        p.push((function(pp) {
            return function(cb) {
                preprocessor(file, original, raw, cb);
            };
        })(preprocessor));
    });
    return p;
}

function addToCache(file, location) {
    console.log('adding to cache', file, location);
    resolveCache[file] = location;
    fs.writeFile(resolveCacheFile, JSON.stringify(resolveCache));
}

exports.service = function static_service(stdin, stderr, stdout, options) {
    var resolvers = [], k;
    for ( k in options.resolvers ) {
        try {
            resolvers.push(require('./' + k).resolver(options.resolvers[k]));
        } catch(e) {
            // lol don't care
        }
    }

    var preprocessors = [];
    for ( k in options.preprocessors ) {
        try {
            preprocessors.push(require('./' + k).preprocessor(options.preprocessors[k]));
        } catch(e) {
            // lol don't care
        }
    }


    // lol, i don't know what I'm doing
    var base = new RegExp('^' + (options.path || '/').replace(/([.?*+^$[\]\\(){}|-])/g, "\\$1") + '(.*)$');
    var root = (options.root || '{cwd}').replace('{cwd}', process.cwd());
    var app = express();
    app.get(base, function(req, res){
        var file = req.params[0];
        if (file in resolveCache) {
            var result = resolveCache[file];
            if (result) {
                res.type(path.extname(file));

                fs.readFile(result, function(err, data) {
                    async.series(buildPreprocessors(preprocessors, file, result, data.toString()), function(err, processedData) {
                        processedData = processedData.filter(function(d) { return !!d; });
                        if (processedData.length) {
                            res.send(processedData[0]);
                        } else {
                            res.send(data);
                        }
                        
                    });
                });
            }
            return;
        }
        async.waterfall(buildResolvers(resolvers, file), function(err, results) {
            var possibilities = [];
            results = results || [];
            results.forEach(function(f) {
                if (f[0] !== '/') {
                    f = path.join(root, f);
                }
                possibilities.push(f);
            });
            async.detectSeries(possibilities, (fs.exists || path.exists), function(result) {
                console.log('done resolving', file);
                if (result) {
                    console.log('found', result);
                    console.log('serving...', result);
                    // this is fucked because Express's res.sendfile() is broken
                    addToCache(file, result);
                    fs.createReadStream(result).pipe(res.type(path.extname(file)));
                } else {
                    res.status(404).type('text/plain').send('File not found.');
                }
            });
        });
    });

    app.listen(options.listen);

    return {process: app, port: options.listen};
};
