const debug = require('debug')('dgmc:dbclient')
const path = require('path')
const grpc = require('grpc')
const proto = path.resolve(__dirname, '../protos/database.proto')
const database = grpc.load(proto).database
const moment = require('moment')

let _dbClient = null
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
    _dbClient = client
    if (cb) cb(null)
  })
}
exports.init = init

let reportCache = null
function getLiveReport () {
  return reportCache
}
exports.getLiveReport = getLiveReport
function subLiveReport () {
  let call = _dbClient.liveDailyReport({})
  call.on('data', report => {
    debug('Daily report updated')
    echo(report)
    reportCache = report
  })
  call.on('error', err => {
    throw (new Error(err))
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
exports.subLiveReport = subLiveReport

let weekCache = null
exports.getWeekReport = function (cb) {
  if (weekCache && isUpToDate(weekCache.lastUpdate))
    return cb(null, weekCache)
  getWeekReport(cb)
}
function isUpToDate (ts) {
  return moment().isSame(new Date(ts), 'day')
}
function getWeekReport (cb) {
  let end = moment().startOf('day').valueOf()
  let from = moment(end).subtract(7, 'day').valueOf()
  _dbClient.getFullReport({from, end}, (err, res) => {
    if (err) return cb(err, [])
    let {reports} = res

    let weekReport = {langs: [], flow: []}
    for (let report of reports) {
      let {date, langs, flow} = report
      date = Number(date)
      langs = langs.map(e => {
        e.date = date
        return e
      })
      flow = flow.map(e => {
        e.date = date
        return e
      })
      weekReport.langs.push(...langs)
      weekReport.flow.push(...flow)
    }
    weekReport.lastUpdate = Date.now()
    weekCache = weekReport
    cb(null, weekReport)
  })
}
