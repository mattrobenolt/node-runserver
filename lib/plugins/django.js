var spawn = require('child_process').spawn,
    fs = require('fs');

var is_sudo = !!process.env.SUDO_USER;


exports.service = function django_service(stdin, stderr, stdout, options) {
    var port = ~~options.listen || 8000;
    var manage_py = options.manage_py.replace('{cwd}', process.cwd());
    var django = spawn(manage_py, ['runserver', '127.0.0.1' + port]);
    django.stdout.setEncoding('utf8');
    django.stderr.setEncoding('utf8');
    django.stdout.on('data', function(data){
        data = data.toString();
        stdout.write(data);
        if(~data.indexOf('Quit the server with CONTROL-C.')){
            var i = rl.createInterface(stdin, stdout, null);
            var timeout = setTimeout(function(){
                              console.log('...too slow');
                              i.close();
                              process.stdin.destroy();
                          }, 2000);
            i.question('Press '+'[Enter]'.blue.bold+' to launch your browser.', function(answer){
                console.log('Launching browser...');
                if (is_sudo) {
                    exec('su '+process.env.SUDO_USER+' -c \'open "http://dev.disqus.org:8000/"\'');
                } else {
                    exec('open "http://dev.disqus.org:8000/"');
                }
                console.log();

                i.close();
                stdin.destroy();
                clearTimeout(timeout);
            });
        }
    });

    django.stderr.on('data', function (data) {
        stdout.write(data.red.bold);
    });

    return {process: django, port: port};
};


function resolve(path, cb) {
    exec(manage_py + ' findstatic --first '+path, function(err, stdout, stderr) {
        if(stdout) {
            stderr = 0;
            var lines = stdout.split('\n'), i = 0;
            for (; i < lines.length; i++) {
                if (/^Found /.test(lines[i])) {
                    stdout = lines[i + 1].replace(/^\s+|\s+$/, '');
                    break;
                }
            }
        } else {
            stdout = 0;
            stderr = 1;
        }
        resolveCache[path] = {stderr: stderr, stdout: stdout};
        fs.writeFileSync(resolveCacheFile, JSON.stringify(resolveCache));
        cb(stderr, stdout);
    });
}

exports.resolver = resolve;
