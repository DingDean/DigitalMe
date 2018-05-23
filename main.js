require('dotenv').config()
const express = require('express')
const app = express()
const http = require('http').Server(app);
const io = require('socket.io')(http);
const path = require('path')
const debug = require('debug')('digitme')
const relay = require('./src/relay.js')
const mongoose = require('mongoose')
mongoose.connect('mongodb://localhost/digitalme')
const mongo = require('./src/mongodb.js')(mongoose)
const utils = require('./src/utils.js')


let libPath = path.resolve(__dirname, './lib')
let ioPath = path.resolve(__dirname, './node_modules/socket.io-client/dist/')
let controllerPath = path.resolve(__dirname, './controllers')

let staticPath = path.resolve(__dirname, './pwa-digitalme/dist')

//app.use('/lib', express.static( libPath ));
//app.use('/lib', express.static( ioPath ));
//app.use('/controllers', express.static( controllerPath ));
app.use('/', express.static(staticPath))

app.get('/', (req, res) => {
  res.send( path.resolve( staticPath, './index.html' ) )
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

relay.on('digit_ping', data => {
  debug('ping')
  io.sockets.emit('char')
})

relay.on('digit_session', data => {
  debug("Session received:")
  debug(data)
  let { ts, history=[], tomatos=[] } = data

  let reportInfo = utils.parseForReport( history )
  for ( let qstring in reportInfo ) {
    if ( !reportInfo.hasOwnProperty(qstring) )
      continue
    let { date, hour, langs } = reportInfo[qstring]
    mongo.utils.updateReport( {date, hour}, langs, (err, doc) => {
      if (err) {
        debug("Failed to update report")
        debug(err)
      }
    })
  }

  let langInfo = utils.parseForLangs( history )
  mongo.utils.updateLangs(langInfo)
})

let RELAY_PORT = process.env.RELAY_PORT || 8764
relay.listen(`tcp://*:${RELAY_PORT}`, err => {
  if (err)
    return debug(err)
  debug(`Relay server listening on ${RELAY_PORT}...`)
})
