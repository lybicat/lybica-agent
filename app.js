/* jshint node: true */
'use strict';

var os = require('os');
var fs = require('fs');
var config = require('./config');
var spawn = require('child_process').spawn;
var moment = require('moment');

// TODO: extra requirements:
// 1. lybica module should be in PYTHONPATH
// 2. LYBICA_API_URL
// 3. LYBICA_HDFS_URL
delete process.env.http_proxy;
delete process.env.https_proxy;

process.env.LYBICA_API_URL = config.LYBICA_API_URL;
process.env.LYBICA_HDFS_URL = config.LYBICA_HDFS_URL;
process.env.PYTHONPATH = config.PYTHONPATH;

function Agent() {
  this.labels = config.LABELS;
  this.platform = os.type();
  this.name = os.hostname();
  this.runners = {
    all: config.RUNNERS,
    running: 0
  };
}

Agent.prototype.canRun = function(task) {
  if (agent.runners.all === agent.runners.running) {
    console.log('no more runners available');
    return false;
  }
  var taskLabels = task.labels || [];
  return taskLabels.filter(function(l) {
    return config.LABELS.indexOf(l) < 0;
  }).length === 0;
};

Agent.prototype.run = function(task, callback) {
  console.log('run task: %j', task);
  agent.runners.running += 1;
  process.env.TASK_ID = task._id; // set env variable TASK_ID
  var workspace = __dirname + '/builds/' + task._id;
  process.env.WORKSPACE = workspace;

  fs.mkdir(workspace, function(err) {
    if (err) return callback(err);

    var consoleStream = fs.createWriteStream(workspace + '/console_' + moment().format('YYYYMMDDHHmmss') + '.txt');

    var runner = spawn('python', ['-m', 'lybica']);

    runner.stdout.pipe(consoleStream);
    runner.stderr.pipe(consoleStream);

    runner.on('close', function(code) {
      console.log('Exit Code: ' + code);
      // TODO: cleanup workspace
      agent.runners.running -= 1;
      callback(null, code);
    });
  });
};


var agent = new Agent();

var socket = require('socket.io-client')(config.SERVER_ADDR);

console.log('start lybica agent, try to connect to "%s"', config.SERVER_ADDR);

socket.on('connect', function() {
  console.log('connected! update agent status');
  socket.emit('agent', agent);
});

socket.on('task', function(task) {
  if (agent.canRun(task)) {
    console.log('start to run task "%s"', task._id);
    socket.emit('start');
    agent.run(task, function(err, exitCode) {
      if (err) {
        socket.emit('error', err);
        return;
      }
      console.log('task "%s" done with exit code "%d"', task._id, exitCode);
      socket.emit('done');
    });
  }
});

socket.on('console', function(msg) {
  console.log('got console event for task %s', msg.task);
  if (socket.id !== msg.from) {
    socket.emit('data', {to: msg.from, data: 'hello world'});
  }
});

socket.on('disconnect', function() {
  console.log('agent disconnected!');
});

