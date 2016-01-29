/* jshint node: true */
'use strict';

var os = require('os');
var fs = require('fs');
var config = require('./config');
var spawn = require('child_process').spawn;
var _ = require('lodash');
var Tail = require('tail').Tail;
var log4js = require('log4js');
log4js.configure(config.LOG4JS_SETTINGS);
var logger = log4js.getLogger('agent');

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
  this.tasks = [];
}

Agent.prototype.canRun = function(task) {
  // TODO: agent ip should match task ctrl pc ip
  if (agent.runners.all === agent.runners.running) {
    logger.warn('no more runners available');
    return false;
  }
  var taskLabels = task.labels || [];
  return taskLabels.filter(function(l) {
    return config.LABELS.indexOf(l) < 0;
  }).length === 0;
};

Agent.prototype.run = function(task, callback) {
  logger.info('run task: %j', task);
  var taskId = task._id;
  agent.runners.running += 1;
  process.env.TASK_ID = taskId; // set env variable TASK_ID
  var workspace = __dirname + '/builds/' + taskId;
  process.env.WORKSPACE = workspace;
  var consoleTxt = workspace + '/' + taskId + '_console.txt';
  agent.tasks.push({id: taskId, consoletxt: consoleTxt}); // save task into agent tasks

  fs.mkdir(workspace, function(err) {
    if (err) {
      socket.emit('error', err);
      logger.error('failed to create workspace "%s", error: %s', workspace, err);
    }

    var consoleStream = fs.createWriteStream(consoleTxt);

    var runner = spawn('python', ['-m', 'lybica']);

    runner.stdout.pipe(consoleStream);
    runner.stderr.pipe(consoleStream);

    runner.on('close', function(code) {
      // TODO: cleanup workspace if code is 0
      logger.info('Exit Code: ' + code);
      _.remove(agent.tasks, function(e) {
        return e.id === taskId;
      });
      agent.runners.running -= 1;
      callback(null, code);
    });
  });
};


var agent = new Agent();

var socket = require('socket.io-client')(config.SERVER_ADDR);

logger.info('start lybica agent, try to connect to "%s"', config.SERVER_ADDR);

socket.on('connect', function() {
  logger.info('connected! update agent status');
  socket.emit('agent', agent);
});

socket.on('task', function(task) {
  if (agent.canRun(task)) {
    logger.info('start to run task "%s"', task._id);
    socket.emit('start', task);
    agent.run(task, function(err, exitCode) {
      if (err) {
        socket.emit('error', err);
        return;
      }
      logger.info('task "%s" done with exit code "%d"', task._id, exitCode);
      socket.emit('done', task);
    });
  }
});

socket.on('console', function(msg) {
  logger.info('got console event for task %s', msg.task);
  var task = _.find(agent.tasks, {id: msg.task});
  if (task === undefined) {
    logger.warn('cannot find task %s', msg.task);
    return;
  }
  // READ from console file
  fs.createReadStream(task.consoletxt)
    .on('data', function(data) {
      socket.emit('data', {to: msg.from, data: data.toString()});
    })
    .on('close', function() {
      // Tail
      var tail = new Tail(task.consoletxt);

      tail.on('line', function(data) {
        socket.emit('data', {to: msg.from, data: data + '\n'});
      });

      tail.on('error', function(error) {
        socket.emit('error', error);
      });
    });
});

socket.on('disconnect', function() {
  logger.info('agent disconnected by remote server!');
});

