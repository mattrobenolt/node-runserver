var spawn = require('child_process').spawn,
    exec = require('child_process').exec,
    fs = require('fs');

var is_sudo = !!process.env.SUDO_USER;


exports.service = function django_service(stdin, stderr, stdout, options) {
    var manage_py = options.manage_py.replace('{cwd}', process.cwd());
    var django = spawn(manage_py, ['runserver', '127.0.0.1' + options.listen]);
    django.stdout.setEncoding('utf8');
    django.stderr.setEncoding('utf8');
    django.stdout.on('data', function(data){
        data = data.toString();
        stdout.write(data);
        // if(~data.indexOf('Quit the server with CONTROL-C.')){
        //     var i = rl.createInterface(stdin, stdout, null);
        //     var timeout = setTimeout(function(){
        //                       console.log('...too slow');
        //                       i.close();
        //                       process.stdin.destroy();
        //                   }, 2000);
        //     i.question('Press '+'[Enter]'.blue.bold+' to launch your browser.', function(answer){
        //         console.log('Launching browser...');
        //         if (is_sudo) {
        //             exec('su '+process.env.SUDO_USER+' -c \'open "http://dev.disqus.org:8000/"\'');
        //         } else {
        //             exec('open "http://dev.disqus.org:8000/"');
        //         }
        //         console.log();

        //         i.close();
        //         stdin.destroy();
        //         clearTimeout(timeout);
        //     });
        // }
    });

    django.stderr.on('data', function (data) {
        stdout.write(data.red.bold);
    });

    return {process: django, port: port};
};


exports.resolver = function(options) {
    return function django_resolver(files, cb) {
        // just resolve one for now to be lazy
        var possibilities = [];
        var args = [options.python.replace('{cwd}', process.cwd()), options.manage_py.replace('{cwd}', process.cwd()), 'findstatic', '--first'].concat(files);
        console.log('asking django...', args.join(' '));
        exec(args.join(' '), function(err, stdout, stderr) {
            if(stdout) {
                //console.log(stdout.green);
                var lines = stdout.split('\n'), i = 0;
                for (; i < lines.length; i++) {
                    if (/^Found /.test(lines[i])) {
                        possibilities.push(lines[++i].replace(/^\s+|\s+$/, ''));
                    }
                }
            }
            if(stderr) {
                stderr.split('\n').forEach(function(line) {
                    var matches = line.match(/^No matching file found for '([^']+)'\.$/);
                    if (matches) {
                        console.log('match not found', matches[1]);
                        possibilities.push(matches[1]);
                    }
                });
            }
            cb(null, possibilities);
        });
    };
};
