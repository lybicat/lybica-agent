/* jshint node: true */
'use strict';

exports.SERVER_ADDR = process.env.LYBICA_SOCKET_URL || 'http://localhost:3000';
exports.LABELS = ['python', 'node'];
exports.RUNNERS = 2;
