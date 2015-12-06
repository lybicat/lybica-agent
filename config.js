/* jshint node: true */
'use strict';

var os = require('os');

exports.SERVER_ADDR = process.env.LYBICA_SOCKET_URL || 'http://localhost:3000';
exports.LABELS = (process.env.AGENT_LABELS || '').split(',');
exports.RUNNERS = parseInt(process.env.AGENT_RUNNERS) || os.cpus().length;

