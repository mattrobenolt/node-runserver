var express = require('express'),
    path = require('path'),
    fs = require('fs'),
    async = require('async'),
    send = require('send');

function buildResolvers(resolvers, file) {
    // this may be the worst code I've ever written in my life to facilitate async.waterfall()
    var all = [(function(first, file) {
        return function(cb) {
            first([file], cb);
        };
    })(resolvers[0], file)].concat(resolvers.slice(1));
    return all;
}

exports.service = function static_service(stdin, stderr, stdout, options) {
    var resolvers = [];
    for ( var k in options.resolvers ) {
        try {
            resolvers.push(require('../plugins/' + k).resolver(options.resolvers[k]));
        } catch(e) {
            // lol don't care
        }
    }
    resolvers.push(exports.resolver());

    // lol, i don't know what I'm doing
    var base = new RegExp('^' + (options.path || '/').replace(/([.?*+^$[\]\\(){}|-])/g, "\\$1") + '(.*)$');
    var root = (options.root || '{cwd}').replace('{cwd}', process.cwd());
    var app = express();
    app.get(base, function(req, res){
        var file = req.params[0];
        async.waterfall(buildResolvers(resolvers, path.join(root, file)), function(err, result) {
            if (err) {
                return res.type('text/plain').send(404, 'File not found.');
            }
            console.log('serving...', result, file);

            // this is fucked because Express's res.sendfile() is broken
            var sender = send(req, path.basename(result));
            sender.root(path.dirname(result));
            sender.pipe(res.type(path.extname(file)));
        });
    });

    app.listen(options.listen);

    return {process: app, port: options.listen};
};


exports.resolver = function(options){
    return function basic_resolver(files, cb) {
        console.log('looking for...', files);
        async.detectSeries(files, (fs.exists || path.exists), function(results) {
            console.log(results);
            if (results) {
                console.log('found', results);
                return cb(null, results);
            }
            return cb('not found');
        });
    };
};
