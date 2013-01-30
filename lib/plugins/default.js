var spawn = require('child_process').spawn;

exports.service = function basic_service(stdin, stderr, stdout, options) {
    var port = ~~options.listen || 8000;
    var cmd = options.cmd.replace('{cwd}', process.cwd()).replace('{port}', port).split(' ');
    var child = spawn(cmd[0], cmd.slice(1));

    console.log('running command', cmd);

    child.stdout.setEncoding('utf8');
    if ( typeof options.stdout === 'undefined' || options.stdout ) {
        var stdout_effects = options.stdout && options.stdout.split('.') || [];
        child.stdout.on('data', function(data){
            stdout_effects.forEach(function(effect) {
                data = data[effect];
            });
            stdout.write(data);
        });
    }

    child.stderr.setEncoding('utf8');
    if ( typeof options.stderr === 'undefined' || options.stderr ) {
        var stderr_effects = options.stderr && options.stderr.split('.') || [];
        child.stderr.on('data', function(data){
            if (/^execvp\(\)/.test(data)) {
                console.log('Failed to start `' + cmd.join(' ') + '`');
                return;
            }
            stderr_effects.forEach(function(effect) {
                data = data[effect];
            });
            stderr.write(data);
        });
    }

    return {process: child, port: port};
};
