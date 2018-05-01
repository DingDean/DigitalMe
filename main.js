require('dotenv').config()
const express = require('express')
const app = express()
app.set('view engine', 'pug')
const http = require('http').Server(app);
const io = require('socket.io')(http);
const path = require('path')
const net = require('net')
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

const Gate = net.createServer(c => {
  c.on('data', data => {
    debug(`msg received ${data}`)
    data = JSON.parse(data)
    io.sockets.emit('char', data)
  })
})

Gate.on('error', err => {
  throw(new Error(err))
})

let port = process.env.RELAY_PORT || 8764
Gate.listen(port, () => {
  debug(`Gateway open to ${port}`)
})
