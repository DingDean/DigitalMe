const mongoose = require('mongoose')
const Cache = require('./cache.js')
const cache = new Cache()

const Report = mongoose.model('Session', mongoose.Schema({
  date: Number,
  hour: Number,
  langs: [{
    ftype: String,
    ticks: Number,
    totalTime: Number // in ms
  }]
}))

function getReport (query, cb) {
  let { date, hour } = query
  let qstring = `${date}#${hour}`
  let c = cache.get(qstring)
  if (c)
    return cb(c)

  Report.findOne({date, hour}, (err, doc) => {
    if (err)
      return cb(null)

    cache.set(qstring, doc)
    cb(doc)
  })
}
exports.getReport = getReport

function updateReport (query, langs, cb) {
  let { date, hour } = query
  Report.findOne({date, hour}, (err, doc) => {
    if (err)
      return cb(err)
    if (!doc) {
      createReport(query, langs, (err, doc) => {
        if (err)
          return cb(err)
        cb(null, doc)
      })
    } else {
      for (let lang of langs) {
        let {type: ftype, ticks, duration} = lang
        let old = doc.langs.find(e => e.ftype === ftype)
        if (old) {
          old.ticks += ticks
          old.totalTime += duration
        } else
          doc.langs.push({ ftype, ticks, totalTime: duration })
      }
      doc.save((err, doc) => {
        if (err)
          return cb(err)
        cache.set(`${date}#${hour}`, doc)
        cb(null, doc)
      })
    }
  })
}
exports.updateReport = updateReport

function createReport (query, langs, cb) {
  let { date, hour } = query
  let record = { date, hour, langs: [] }
  for (let lang of langs) {
    let {type: ftype, ticks, duration} = lang
    record.langs.push({ftype, ticks, totalTime: duration})
  }
  let report = new Report(record)
  report.save((err, doc) => {
    if (err)
      return cb(err, doc)
    cache.set(`${date}#${hour}`, doc)
    cb(null, doc)
  })
}
exports.createReport = createReport
