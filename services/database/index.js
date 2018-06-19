require('dotenv').config()
const mongoose = require('mongoose')
const debug = require('debug')('dgmc:session')
const session = require('./session.model.js')
const path = require('path')
const moment = require('moment')

const grpc = require('grpc')
const proto = path.resolve(__dirname, '../../protos/database.proto')
const database = grpc.load(proto).database

function init (endpoint) {
  mongoose
    .connect(endpoint)
    .then(() => {
      debug('Connection to mongodb established')
    })
    .catch(err => {
      debug(err)
    })
}

function saveSession (call, callback) {
  let {sessions} = call.request
  let len = sessions.length
  let docs = []
  for (let s of sessions) {
    session.save(s, (err, doc) => {
      len--
      if (err)
        debug(err)
      else
        docs.push(doc)

      if (len === 0) {
        callback(null, {statusCode: 0, errMsg: ''})
        session.updateReportCache(docs, () => {
          pushDailyReport()
        })
      }
    })
  }
}

function saveTomato (call, callback) {
  debug(call.request)
  callback(null, {statusCode: 0, errMsg: ''})
}

// TODO:
function getLangReport (call, callback) {
  let {TimeRange} = call.request
  debug('onGetLangReport')
  debug(TimeRange)
  callback(null, {reports: []})
}

// TODO:
function getTimeflow (call, callback) {
  let {TimeRange} = call.request
  debug('onGetTimeflow')
  debug(TimeRange)
  callback(null, {reports: []})
}

// TODO:
function getFullReport (call, callback) {
  let {from, end} = call.request
  from = Number(from)
  end = Number(end)
  session.getFullReport({from, end}, reports => {
    callback(null, {reports})
  })
}

let subs = []
function liveDailyReport (call) {
  subs.push(call) // save stream for future live update
  session.getDailyReport(report => {
    call.write(report)
  })
}
function pushDailyReport () {
  session.getDailyReport(report => {
    subs.forEach(sub => sub.write(report))
  })
}
process.on('exit', () => {
  subs.forEach(sub => sub.end()) // close stream connections
})

function run (endpoint, credentials, mongo) {
  init(mongo)
  let server = new grpc.Server()
  server.addService(database.DbService.service, {
    saveSession,
    saveTomato,
    getLangReport,
    getTimeflow,
    getFullReport,
    liveDailyReport
  })
  server.bind(endpoint, credentials)
  server.start()
  updateAtMidnight()
}

function updateAtMidnight () {
  let midnight = moment().endOf('day').valueOf()
  let timeout = midnight - Date.now()
  setTimeout(() => {
    session.clearCache()
    setInterval(() => {
      session.clearCache()
    }, 86400000)
  }, timeout)
}

if (require.main === module) {
  let endpoint = process.env.DB_SERVICE || '0.0.0.0:50051'
  run(endpoint, grpc.ServerCredentials.createInsecure(),
    process.env.MONGODB || 'mongodb://localhost/dgmc'
  )
}
exports.run = run
