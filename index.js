#!/usr/bin/env node
var args    = require('minimist')(process.argv.slice(2), {
    default : {
        ttl      : 300,
        interval : 2000
    }
})
var request = require('request')
var Docker  = require('dockerode')

// PARSE & PREP HOSTS

if (!args.dockerhost) { console.error('Missing required argument --dockerhost'); process.exit(1) }
var hosts = args.dockerhost instanceof Array ? args.dockerhost : [args.dockerhost]
hosts = hosts.map(function(host) {
    var details = host.split(':')
    var host_opts = { host : details[0], port : details[1] }
    if (process.env.DOCKER_CERT_CA)   host_opts.ca   = process.env.DOCKER_CERT_CA
    if (process.env.DOCKER_CERT_CERT) host_opts.cert = process.env.DOCKER_CERT_CERT
    if (process.env.DOCKER_CERT_KEY)  host_opts.key  = process.env.DOCKER_CERT_KEY
    return new Docker(host_opts)
})

// PARSE & PREP API

if (!args.apihost) { console.error('Missing required argument --apihost'); process.exit(1) }
var api = args.apihost instanceof Array ? 'http://'+args.apihost[0] : 'http://'+args.apihost

var loop = function () {
    getContainers(function (currContainer) {
        updateDns(currContainer)
    })
}

var getContainers = function (callback) {
    var currContainers = {}
    hosts.forEach(function(host) {
        host.listContainers(function (err, containers) {
            if (!containers) { console.error("ERROR: Unable to query containers", err); return }
            var calls = 0, evalEnd = function () { calls++; if (calls == containers.length) callback(currContainers) }
            containers.forEach(function (container, index) {
                var c = host.getContainer(container.Id)
                c.inspect(function (err, data) {
                    currContainers[container.Id] = data
                    evalEnd(index)
                })
            })
        })        
    })
}
 
var updateDns = function (containers, callback) {
    Object.keys(containers).forEach(function (id) {
        var group = containers[id].Config.Image
        if (group.indexOf('/') > 0) group = group.split('/')[1]
        var name = containers[id].Name + '.' +group;
        name = name.replace(':','.')
        request({
            url     : api+name,
            method  : 'PUT',
            json    : true,
            body    : { A : [{address:containers[id].NetworkSettings.IPAddress}], ttl : args.ttl },
            timeout : args.interval / 2
        }, function (err, res) {
            if (err) { console.error('ERROR: Unable to update DNS', err.code); return }
            if (res.statusCode != 200) console.log(res.statusCode)
        })
    })
}
 
loop()
setInterval(loop, args.interval)