const debug = require('debug')('mongo')
let Cache = function () {
  this.cache = {}
}
Cache.prototype.get = function (key) {
  return this.cache[key]
}

Cache.prototype.set = function (key, info) {
  this.cache[key] = info
}

let reportCache = new Cache()
let langCache = new Cache()

module.exports = function (mongoose) {
  // daily report for languages
  const Report = mongoose.model('Session', mongoose.Schema({
    date: Number,
    hour: Number,
    langs: [{
      ftype: String,
      ticks: Number,
      totalTime: Number // in ms
    }]
  }))

  // daily report for a single language
  const Lang = mongoose.model('Lang', mongoose.Schema({
    date: Number,
    ftype: String,
    ticks: Number,
    totalTime: Number
  }))

  const Tomato = mongoose.model('Tomato', mongoose.Schema({
    date: Number,
    type: Number, // 0-finished, 1-abandoned
    tStart: Number,
    tEnd: Number
  }))

  let utils = {}

  utils.getReport = function (query, cb) {
    let { date, hour } = query
    let qstring = `${date}#${hour}`
    let c = reportCache.get(qstring)
    if (c)
      return cb(c)

    Report.findOne({date, hour}, (err, doc) => {
      if (err)
        return cb(null)

      reportCache.set(qstring, doc)
      cb(doc)
    })
  }

  utils.updateReport = function (query, langs, cb) {
    let { date, hour } = query
    Report.findOne({date, hour}, (err, doc) => {
      if (err)
        return cb(err)
      if (!doc) {
        utils.createReport(query, langs, (err, doc) => {
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
          reportCache.set(`${date}#${hour}`, doc)
          cb(null, doc)
        })
      }
    })
  }

  utils.createReport = function (query, langs, cb) {
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
      reportCache.set(`${date}#${hour}`, doc)
      cb(null, doc)
    })
  }

  utils.getLang = function ({date, lang}, cb) {
    let qstring = `${date}#${lang}`
    let c = langCache.get(qstring)
    if (c)
      return cb(c)
    Lang.findOne({date, lang}, (err, doc) => {
      if (err)
        return cb(err)
      langCache.set(qstring, doc)
      cb(null, doc)
    })
  }

  utils.updateLangs = function (langsInfo) {
    for (let qs in langsInfo) {
      if (!langsInfo.hasOwnProperty(qs))
        continue

      let info = langsInfo[qs]
      let {date, ftype, ticks, duration} = info
      Lang.findOne({date, ftype}, (err, doc) => {
        if (err)
          return debug(err)
        if (!doc) {
          utils.createLang(info, (err, doc) => {
            if (err)
              debug(err)
          })
        } else {
          doc.ticks += ticks
          doc.totalTime += duration
          doc.save((err, doc) => {
            if (err)
              return debug(err)
            langCache.set(`${date}#${ftype}`, doc)
          })
        }
      })
    }
  }

  utils.createLang = function (info, cb) {
    let {date, ftype, ticks, duration: totalTime} = info
    let lang = new Lang({date, ftype, ticks, totalTime})
    lang.save((err, doc) => {
      if (err)
        return cb(err, doc)
      langCache.set(`${date}#${ftype}`, doc)
      cb(null, doc)
    })
  }

  utils.updateTomatos = function (tomatos) {
    tomatos.forEach(tomato => {
      let record = new Tomato(tomato)
      record.save((err, doc) => {
        if (err)
          return debug(err)
      })
    })
  }

  return { Report, Lang, Tomato, utils }
}
