/* jshint node: true */
'use strict';

var os = require('os');
var config = require('./config');
var socket = require('socket.io-client')(config.SERVER_ADDR);
var spawn = require('child_process').spawn;


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

Agent.prototype.run = function(task) {
  console.log('run task: %j', task);
  agent.runners.running += 1;
  process.env.TASK_ID = task._id;
  var runner = spawn('python', ['-m', 'lybica']);

  runner.stdout.on('data', function(data) {
    console.log('stdout: ' + data);
  });

  runner.stderr.on('data', function(data) {
    console.log('stderr: ' + data);
  });

  runner.on('close', function(code) {
    console.log('Exit Code: ' + code);
    agent.runners.running -= 1;
  });
};


var agent = new Agent();

socket.on('connect', function() {
  socket.emit('agent', agent);
});

socket.on('task', function(task) {
  if (agent.canRun(task)) {
    agent.run(task);
  }
});

socket.on('disconnect', function() {
});

