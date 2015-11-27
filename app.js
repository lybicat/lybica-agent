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

Agent.prototype.run = function(task) {
  console.log('run task: %j', task);
};


var agent = new Agent();


socket.on('connect', function() {
  socket.emit('agent', agent);
});

socket.on('task', function(task) {
  console.log(task);
  if (agent.runners.all === agent.runners.running) {
    console.log('no more runners available');
    return;
  }
  var taskLabels = task.labels || [];
  var labelMatched = taskLabels.filter(function(l) {
    return config.LABELS.indexOf(l) < 0;
  }).length === 0;

  if (labelMatched) {
    agent.runners.running += 1;
    agent.run(task);
    agent.runners.running -= 1;
  }
});

socket.on('disconnect', function() {
});
