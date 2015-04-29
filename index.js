#!/usr/bin/env node
var args    = require('minimist')(process.argv.slice(2), {
    default : {
        ttl      : false,
        interval : 10,
        logging  : 'quiet',
        grouptag : false
    }
})
var fs      = require('fs')
var request = require('request')
var Docker  = require('dockerode')
var dockerHost = require('docker-host')

// PARSE & PREP HOSTS

if (!args.dockerhost) { console.error('Missing required argument --dockerhost'); process.exit(1) }
var hosts = args.dockerhost instanceof Array ? args.dockerhost : [args.dockerhost]
hosts = hosts.map(function(host) {
    var host_opts = dockerHost(host) 
    if (host_opts.socketPath) delete host_opts.protocol
    if (host_opts.protocol) host_opts.protocol = host_opts.protocol.split(':')[0]
    if (process.env.DOCKER_CERT_CA)   host_opts.ca   = fs.readFileSync(process.env.DOCKER_CERT_CA)
    if (process.env.DOCKER_CERT_CERT) host_opts.cert = fs.readFileSync(process.env.DOCKER_CERT_CERT)
    if (process.env.DOCKER_CERT_KEY)  host_opts.key  = fs.readFileSync(process.env.DOCKER_CERT_KEY)
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

        // Format Name
        var group = containers[id].Config.Image
        if (group.indexOf('/') > 0) group = group.split('/')[1]
        var name = containers[id].Name + '.' +group.replace('.','-');
        if (args.grouptag) name = name.replace(':','-')
        else name = name.split(':')[0]

 var ip = containers[id].NetworkSettings.IPAddress;
        // Format Body
        var body = { A : [{address:ip}] }
        if (typeof args.ttl === 'number') body.ttl = args.ttl

        //console.log(name)
        //console.log(body)
       var fn = function(name1){
        //console.log('name'+name1+' ip:'+ip);
        if(!name1){
           return;
        }
        request({
            url     : api+name1,
            method  : 'PUT',
            json    : true,
            body    : body,
            timeout : args.interval*1000 / 2
        }, function (err, res) {
            if (err) { console.error('ERROR: Unable to update DNS', err.code); return }
            if (res.statusCode != 200) console.error(res.statusCode)
            if (args.logging == 'loud') console.log('Successfully updated DNS for container '+id+' with name '+name1)
        })
        };
        fn(name);
        var h = containers[id].Config.Hostname
        if(name != h){
           fn('/'+h);
        }

    })
}
 
loop()
setInterval(loop, args.interval*1000)
