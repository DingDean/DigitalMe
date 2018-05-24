const zmq = require('zeromq')
const debug = require('debug')('digitme:relay')

const EventEmitter = require('events')
class Wrapper extends EventEmitter {}

const wrapper = new Wrapper()
wrapper.listen = function (path, callback) {
  const responder = zmq.socket('pull')
  responder.monitor()

  responder.on('message', request => {
    let msg = JSON.parse(request.toString())
    debug('Received message: [', msg, ']')
    let {event, data} = msg
    wrapper.emit(event, data)
  })

  responder.on('error', err => {
    responder.close()
    throw (new Error(err))
  })

  responder.bind(path, callback)

  process.on('SIGINT', () => {
    responder.close()
    process.exit()
  })
}

module.exports = wrapper
