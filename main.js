require('dotenv').config()
const express = require('express')
const app = express()
const http = require('http').Server(app)
const io = require('socket.io')(http)
const path = require('path')
const debug = require('debug')('dgmc')
const pager = require(path.resolve(__dirname, './services/pager'))

let staticPath = path.resolve(__dirname, './pwa-digitalme/dist')
app.use('/', express.static(staticPath))

app.get('/', (req, res) => {
  res.send(path.resolve(staticPath, './index.html'))
})

io.on('connection', socket => {
  debug('A user connected')

  socket.on('disconnect', () => {
    debug('A user disconnected')
  })

  socket.on('ping', (msg) => {
    debug(`ping`)
    socket.emit('pong', 'hello there')
  })
})

pager.run('0.0.0.0:50052', null, io)

http.listen(8765, () => {
  debug('listening on 8765')
})
