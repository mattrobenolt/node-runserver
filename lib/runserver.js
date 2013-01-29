var express = require('express'),
    httpProxy = require('http-proxy'),
    _child = require('child_process'),
    path = require('path'),
    fs = require('fs'),
    colors = require('colors'),
    util = require('util'),
    rl = require('readline'),
    less = require('less');


function main() {
    var sudo = !!process.env.SUDO_UID,
        resolveCacheFile = process.cwd() + '/.runserver_cache.json',
        resolveCache = {},
        startingPort = 4000,
        router = {};
    
    var services = [];
    var serviceByName = {};
    var config = require(process.cwd() + '/runserver.json');
    
    config.services.forEach(function(options) {
        var plugin;
        try {
            // First, try to load from our local plugins
            plugin = require('./plugins/' + (options.plugin || 'default')).service;
        } catch(_) {
            try {
                // Next, try anything importable
                plugin = require(options.plugin).service;
            } catch(_) {
                process.stderr.write('Cannot find plugin `' + options.plugin + '`\n');
                process.exit(1);
            }
        }
        options.listen = options.listen || startingPort++;
        options.service = plugin(process.stdin, process.stderr, process.stdout, options);
        services.push(options);
        serviceByName[options.name] = options;
        router[options.host || 'localhost'] = options.listen;
    });

    var server = {router:{}};
    for ( var route in router ) {
        var port = router[route];
        console.log((config.ssl ? 'https': 'http') + '//' + route + ':' + config.listen + ' is running...');
        route = route.replace(/\./g, '\\.');
        route = route.replace(/^\*\\./, '(.+\.)?');
        server.router[route] = 'localhost:' + port;
    }
    
    if ( config.ssl ) {
    
    }
    
    httpProxy.createServer(server).listen(~~config.listen);
    
    // Make sure all children are killed
    process.on('SIGTERM', cleanup);
    process.on('SIGNINT', cleanup);
    
    function cleanup() {
        services.forEach(function(service){
            try{
                process.kill(service.service.process.pid);
            } catch(e){}
        });
    }
}

exports.run = main;
