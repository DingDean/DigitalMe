const debug = require('debug')('dgmc:session')
const mongoose = require('mongoose')
const moment = require('moment')

const Session = mongoose.model('Session', mongoose.Schema({
  start: {type: Date, default: Date.now},
  inputTime: {type: Number, default: 0}, // time used in actual typing
  totalTime: {type: Number, default: 0}, // total time
  filename: String,
  filetype: String,
  ticks: Number,
  project: String
}))

function saveSession (conf, cb) {
  let session = {}
  let copy = ['filename', 'project', 'ticks']
  for (let p of copy)
    session[p] = conf[p]
  let {start, end, lastTick, filetype} = conf
  start = Number(start)
  end = Number(end)
  lastTick = Number(lastTick)

  session['inputTime'] = lastTick - start
  session['totalTime'] = end - start
  session['start'] = new Date(start)
  session['filetype'] = mapType(filetype)

  let doc = new Session(session)
  doc.save((err, doc) => {
    if (cb) return cb(err, doc)
    if (err) return debug(err)
    debug('New session saved:')
    debug(session)
  })
}

const mapping = {
  'js': 'javascript',
  'md': 'markdown',
  'go': 'golang',
  'vim': 'vimscript'
}
function mapType (type) {
  if (mapping[type])
    return mapping[type]
  return type
}
exports.save = saveSession

function getDailySessions (callback) {
  Session.aggregate([
    {
      '$addFields': {
        'year': {'$year': '$start'},
        'month': {'$month': '$start'},
        'day': {'$dayOfMonth': '$start'}
      }
    },
    {
      '$match': {
        'year': new Date().getFullYear(),
        'month': new Date().getMonth() + 1,
        'day': new Date().getDate()
      }
    }
  ], callback)
}

let cache = null
function getDailyReport (cb) {
  if (cache && isUpToDate(cache.date)) {
    debug(`server daily report cache: ${new Date(cache.date)}`)
    return cb(cache)
  }
  getDailySessions((err, docs) => {
    if (err) {
      debug(err)
      return []
    }
    cache = genFullReport(docs)
    debug(`new daily report is generated and served: ${new Date(cache.date)}`)
    cb(cache)
  })
}

function isUpToDate (ts) {
  return moment().isSame(new Date(ts), 'day')
}

function genFullReport (docs) {
  let langs = []
  let flow = []
  for (let doc of docs) {
    let {filetype, totalTime, ticks, start} = doc
    start = start.getTime()
    let lang = langs.find(e => e.filetype === filetype)
    if (lang)
      lang.totalTime += totalTime
    else
      langs.push({filetype, totalTime})
    flow.push({from: start, elapsed: totalTime, filetype, ticks})
  }
  return {
    langs,
    flow,
    date: Date.now()
  }
}

function updateReportCache (sessions, cb) {
  if (cache && isUpToDate(cache.date)) {
    for (let session of sessions)
      updateCache(session)
    cacheEcho()
    if (cb) cb(cache)
  } else {
    getDailyReport(report => {
      for (let session of sessions)
        updateCache(session)
      cacheEcho()
      if (cb) cb(cache)
    })
  }
}

function updateCache (session) {
  let {start: from, totalTime: elapsed, filetype, ticks} = session
  from = from.getTime()
  let lang = cache.langs.find(e => e.filetype === filetype)
  if (lang)
    lang.totalTime += elapsed
  else
    cache.langs.push({filetype, totalTime: elapsed})
  cache.flow.push({from, elapsed, filetype, ticks})
}

function cacheEcho () {
  debug('Daily report:')
  let len = cache.langs.length
  let totalTime = cache.langs.reduce((a, b) => a + b.totalTime, 0)
  debug(`So far, ${descTime(totalTime)} is spent on ${len} languages`)
  for (let lang of cache.langs) {
    let t = lang.totalTime
    let type = lang.filetype
    let frac = Math.floor((t / totalTime) * 100)
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

exports.getDailyReport = getDailyReport
exports.updateReportCache = updateReportCache
exports.clearCache = function () {
  cache = null
}

function getSessions (timeRange, callback) {
  let {from, end} = timeRange
  from = new Date(from)
  end = new Date(end)

  Session.aggregate([
    {
      '$match': {
        'start': {'$gte': from, '$lte': end}
      }
    },
    {
      '$group': {
        _id: {
          'year': {'$year': '$start'},
          'month': {'$month': '$start'},
          'day': {'$dayOfMonth': '$start'}
        },
        'langs': {'$push': {
          filetype: '$filetype', totalTime: '$totalTime'
        }},
        'flow': {'$push': {
          filetype: '$filetype',
          from: '$start',
          ticks: '$ticks',
          elapsed: '$totalTime'
        }}
      }
    }
  ], callback)
}

function getLangReport (timeRange, callback) {
  getSessions(timeRange, (err, docs) => {
    if (err) {
      debug(err)
      return []
    }
    let reports = []
    for (let doc of docs) {
      let {langs, _id} = doc
      let {year, month, day} = _id
      let date = new Date(`${year}-${month}-${day}`).getTime()
      reports.push({langs, date})
    }
    reports.sort((a, b) => a.date > b.date) // ascending
    callback(reports)
  })
}
exports.getLangReport = getLangReport

function getFullReport (timeRange, callback) {
  getSessions(timeRange, (err, docs) => {
    if (err) {
      debug(err)
      let tmp = []
      return callback(tmp)
    }
    let reports = []
    for (let doc of docs) {
      let {langs, flow, _id} = doc
      let {year, month, day} = _id
      let date = new Date(`${year}-${month}-${day}`).getTime()
      flow = flow.map(e => {
        e.from = e.from.getTime()
        return e
      })
      reports.push({langs, flow, date})
    }
    reports.sort((a, b) => a.date > b.date) // ascending
    callback(reports)
  })
}
exports.getFullReport = getFullReport
