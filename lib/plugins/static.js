var express = require('express'),
    path = require('path');

exports.service = function static_service(stdin, stderr, stdout, options) {
    var resolvers = [];
    for ( var k in options.resolvers ) {
        try {
            resolvers.push(require('./plugins/' + options.resolvers[k]).resolver);
        } catch (e) {
            // don't care
        }
    }
    // lol, i don't know what I'm doing
    var base = new RegExp('^' + (options.path || '/').replace(/([.?*+^$[\]\\(){}|-])/g, "\\$1") + '(.*)$');
    var root = (options.root || '{cwd}').replace('{cwd}', process.cwd());
    var app = express();
    app.use(express.directory(root));
    app.get(base, function(req, res){
        var file = req.params[0];
        res.sendfile(file, {root: root});
    });

    var port = ~~options.listen || 4001;
    app.listen(port);

    return {process: app, port: port};
};


exports.resolver = function(){};
