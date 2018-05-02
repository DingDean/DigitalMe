require('dotenv').config()
const express = require('express')
const app = express()
app.set('view engine', 'pug')
const http = require('http').Server(app);
const io = require('socket.io')(http);
const path = require('path')
//const net = require('net')
const zmq = require('zeromq')
const debug = require('debug')('digitme')

let libPath = path.resolve(__dirname, './lib')
let ioPath = path.resolve(__dirname, './node_modules/socket.io-client/dist/')
let controllerPath = path.resolve(__dirname, './controllers')

app.use('/lib', express.static( libPath ));
app.use('/lib', express.static( ioPath ));
app.use('/controllers', express.static( controllerPath ));

app.get('/', (req, res) => {
  res.render('./index', {
    controller: "/controllers/simpleHelio.js"
  })
})

io.on('connection', socket => {
  debug('A user connected')

  socket.on('disconnect', () => {
     debug("A user disconnected")
  })

  socket.on('greeting', (msg) => {
    debug(`Client says ${msg}`)
    socket.emit('greeting', "yes")
  })
})

http.listen(8765, () => {
  debug("listening on 8765")
})

const responder = zmq.socket('rep')

responder.on('message', request => {
  debug("Received message: [", request.toString(), "]")
  responder.send("OK")
  io.sockets.emit('char', request.toString() )
})

let RELAY_PORT = process.env.RELAY_PORT || 8764
responder.bind(`tcp://*:${RELAY_PORT}`, err => {
  if (err)
    return debug(err)
  debug(`Relay server listening on ${RELAY_PORT}...`)
})

process.on('SIGINT', () => {
  responder.close()
  process.exit()
})
