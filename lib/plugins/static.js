var express = require('express');

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
    var path = new RegExp('^' + (options.path || '/').replace(/([.?*+^$[\]\\(){}|-])/g, "\\$1") + '(.*)$');
    var app = express.createServer();
    app.get(path, function(req, res){
        var file = req.params[0];
        res.sendfile(file);
    });

    var port = ~~options.listen || 4001;
    app.listen(port);

    return {process: app, port: port};
};


exports.resolver = function(){};
