// modules
const express = require('express')
  , http = require('http')
  , morgan = require('morgan');

// configuration files
const configServer = require('./lib/config/server');

// app parameters
const app = express();
app.set('port', configServer.httpPort);
app.use(express.static(configServer.staticFolder));
app.use(morgan('dev'));

// serve index
require('./lib/routes').serveIndex(app, configServer.staticFolder);

// HTTP server
const server = http.createServer(app);
server.listen(app.get('port'), function () {
  console.log('HTTP server listening on port ' + app.get('port'));
});

// WebSocket server
const io = require('socket.io')(server);
io.on('connection', require('./lib/routes/socket'));

module.exports.app = app;
