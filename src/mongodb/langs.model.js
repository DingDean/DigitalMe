const debug = require('debug')('mongo:langs')
const mongoose = require('mongoose')
const Cache = require('./cache.js')
const cache = new Cache()

// daily report for a single language
const Lang = mongoose.model('Lang', mongoose.Schema({
  date: Number,
  ftype: String,
  ticks: Number,
  totalTime: Number
}))

function getLang ({date, lang}, cb) {
  let qstring = `${date}#${lang}`
  let c = cache.get(qstring)
  if (c)
    return cb(c)
  Lang.findOne({date, lang}, (err, doc) => {
    if (err)
      return cb(err)
    cache.set(qstring, doc)
    cb(null, doc)
  })
}
exports.getLang = getLang

function updateLangs (langsInfo) {
  for (let qs in langsInfo) {
    if (!langsInfo.hasOwnProperty(qs))
      continue

    let info = langsInfo[qs]
    let {date, ftype, ticks, duration} = info
    Lang.findOne({date, ftype}, (err, doc) => {
      if (err)
        return debug(err)
      if (!doc) {
        createLang(info, (err, doc) => {
          if (err)
            debug(err)
        })
      } else {
        doc.ticks += ticks
        doc.totalTime += duration
        doc.save((err, doc) => {
          if (err)
            return debug(err)
          cache.set(`${date}#${ftype}`, doc)
        })
      }
    })
  }
}
exports.updateLangs = updateLangs

function createLang (info, cb) {
  let {date, ftype, ticks, duration: totalTime} = info
  let lang = new Lang({date, ftype, ticks, totalTime})
  lang.save((err, doc) => {
    if (err)
      return cb(err, doc)
    cache.set(`${date}#${ftype}`, doc)
    cb(null, doc)
  })
}
exports.createLang = createLang
