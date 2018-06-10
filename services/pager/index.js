const debug = require('debug')('dgmc:pager')
const grpc = require('grpc')
const path = require('path')
const proto = path.resolve(__dirname, '../../protos/pager.proto')
const pager = grpc.load(proto).pager

function onPing () {
  debug('ping')
  this.sockets.emit('ping')
}

function defaultIo () {
  // TODO: default socketio server over this service
}

function run (endpoint, credentials, io) {
  credentials = credentials || grpc.ServerCredentials.createInsecure()
  let server = new grpc.Server()
  server.addService(pager.PagerService.service, {
    ping: onPing.bind(io)
  })
  server.bind(endpoint, credentials)
  server.start()
}

if (require.main === module) {
  let io = defaultIo()
  run('0.0.0.0:50052', grpc.ServerCredentials.createInsecure(), io)
}
exports.run = run
