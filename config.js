/* jshint node: true */
'use strict';

var os = require('os');

exports.SERVER_ADDR = process.env.LYBICA_SOCKET_URL || 'http://127.0.0.1:3000';
exports.LABELS = (process.env.AGENT_LABELS || '').split(',');
exports.RUNNERS = parseInt(process.env.AGENT_RUNNERS) || os.cpus().length;

exports.LYBICA_API_URL = process.env.LYBICA_API_URL || 'http://127.0.0.1/api';
exports.LYBICA_HDFS_URL = process.env.LYBICA_HDFS_URL || 'http://127.0.0.1:3001/hdfs';
exports.PYTHONPATH = __dirname + '/lybica-runner/src';
exports.LOG4JS_SETTINGS = {
  appenders: [
    {
      type: 'file',
      filename: __dirname + '/logs/access.log',
      maxLogSize: 50 * 1024 * 1024,
      backups: 4
    },
    {
      type: 'logLevelFilter',
      level: 'ERROR',
      appender: {
        type: 'file',
        filename: __dirname + '/logs/error.log',
        maxLogSize: 50 * 1024 * 1024,
        backups: 4
      }
    }
  ],
  replaceConsole: true
};
