const grpc = require('grpc')
const path = require('path')
const names = ['database']

let services = []
for (let name of names) {
  let config = require(path.resolve(__dirname, `./${name}`))
  services.push(config)
}

exports.run = function (endpoint, credentials) {
  let server = new grpc.Server()
  for (let {def, api} of services)
    server.addService(def, api)
  server.bind(endpoint, credentials)
  server.start()
}
