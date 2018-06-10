const debug = require('debug')('dgmc:dbclient')
const path = require('path')
const grpc = require('grpc')
const proto = path.resolve(__dirname, '../protos/database.proto')
const database = grpc.load(proto).database

function init (endpoint, credentials, cb) {
  credentials = credentials || grpc.credentials.createInsecure()
  let client = new database.DbService(
    endpoint, credentials
  )
  client.waitForReady(Date.now() + 60000, err => {
    if (err)
      return cb(err)
    else
      debug('Connected to remote database service')
    if (cb) cb(null, client)
  })
}
exports.init = init

function getLiveReport (client, io) {
  let call = client.liveDailyReport({})
  call.on('data', report => {
    debug('Daily report updated')
    echo(report)
  })
  call.on('error', err => {
    debug(err)
  })
  call.on('end', () => {
    debug('Daily report stream ends')
  })
}

function echo (report) {
  let len = report.langs.length
  let totalTime = report.langs.reduce((a, b) => a + b.totalTime, 0)
  debug(`So far, ${descTime(totalTime)} is spent on ${len} languages`)
  for (let lang of report.langs) {
    let t = lang.totalTime
    let type = lang.filetype
    let frac = Math.floor(t / totalTime * 100)
    debug(`${descTime(t)} is spent on ${type}, accounts for ${frac}%`)
  }
}

function descTime (elapsed) {
  const HOUR = 3600000
  const MINUTE = 60000
  const SECOND = 1000
  let hour = Math.floor(elapsed / HOUR)
  let minutes = Math.floor((elapsed - hour * HOUR) / MINUTE)
  let seconds = Math.floor(
    (elapsed - hour * HOUR - minutes * MINUTE) / SECOND
  )
  return `${hour} hour, ${minutes} minutes and ${seconds} seconds`
}
exports.getLiveReport = getLiveReport
