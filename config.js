/* jshint node: true */
'use strict';

var os = require('os');

exports.SERVER_ADDR = process.env.LYBICA_SOCKET_URL || 'http://localhost:3000';
exports.LABELS = (process.env.AGENT_LABELS || '').split(',');
exports.RUNNERS = parseInt(process.env.AGENT_RUNNERS) || os.cpus().length;


exports.LYBICA_API_URL = 'http://127.0.0.1/api';
exports.LYBICA_HDFS_URL = 'http://127.0.0.1:3001/hdfs';
exports.PYTHONPATH = __dirname + '/../' + 'lybica-runner/src';
