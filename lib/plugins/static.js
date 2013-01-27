exports.service = function static_service(stdin, stderr, stdout, options) {
    var app = express.createServer();
    app.get(/^\/static\/(.+)$/, function(req, res){
        var file = req.params[0];
        if(file.substr(-4) == '.css') {
            resolve(file, function(err, file_) {
                if(err) {
                    var fileLess = file.replace('.css', '.less');
                    resolve(fileLess, function(err, fileLess) {
                        if(err) {
                            return res.sendfile(file_);
                        }
                        fs.readFile(fileLess, 'utf-8', function(err, data) {
                            if(err) {
                                return res.send('Not found.', 404, {'content-type': 'text/plain'});
                            }
                            new(less.Parser)({paths: [path.dirname(fileLess)], optimization:2}).parse(data, function(e, tree) {
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
                                res.send(css, {'content-type': 'text/css'});
                            });
                        });
                    });
                    return;
                }
                res.sendfile(file_);
            });
            return;
        }
        resolve(file, function(err, file_) {
            if(err) {
                return res.send('Not found.', 404, {'content-type': 'text/plain'});
            }
            res.sendfile(file_);
        });
    });

    var port = ~~options.listen || 4001;
    app.listen(port);

    return {process: app, port: port};
};


exports.resolver = function(){};
