require('dotenv').config()
const express = require('express')
const app = express()
const http = require('http').Server(app)
const io = require('socket.io')(http)
const path = require('path')
const debug = require('debug')('dgmc')
const pager = require(path.resolve(__dirname, './services/pager'))
const database = require('./src/database.js')

let staticPath = path.resolve(__dirname, './pwa-digitalme/dist')
app.use('/', express.static(staticPath))

app.get('/', (req, res) => {
  res.send(path.resolve(staticPath, './index.html'))
})

app.get('/api/liveReport', (req, res) => {
  res.send(database.getLiveReport())
})

app.get('/api/weekReport', (req, res) => {
  database.getWeekReport((err, report) => {
    if (err) {
      debug(err)
      return res.send([])
    }
    res.send(report)
  })
})

io.on('connection', socket => {
  debug('A user connected')

  socket.on('disconnect', () => {
    debug('A user disconnected')
  })
})

pager.run('0.0.0.0:50052', /* use default credentials */null, io)
database.init('localhost:50051', null, (err) => {
  if (err)
    throw (new Error(err)) // TODO: throw?
  database.subLiveReport((err) => {
    throw (new Error(err))
  })

  http.listen(8765, () => {
    debug('listening on 8765')
  })
})
