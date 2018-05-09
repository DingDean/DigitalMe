let Cache = function () {
  this.cache = {}
}
Cache.prototype.get = function ( key ) {
  return this.cache[key]
}

Cache.prototype.set = function ( key, info ) {
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
      lang: String,
      tick: Number,
      totalTime: Number // in ms
    }]
  }))


  // daily report for a single language
  const Lang = mongoose.model('Lang', mongoose.Schema({
    date: Number,
    lang: String,
    tick: Number,
    totalTime: Number
  }))

  let utils = {}
  /**
   * Given a timestamp, get the date value for query and index for hour
   *
   * @param {Number} ts timestamp of a session
   * @returns {Object} {query, index}
   */
  utils.getQueryPath = function ( ts ) {
    let date = new Date(ts)
    let hour = date.getHours()
    date.setHours(0)
    date.setMinutes(0)
    date.setSeconds(0)
    date.setMilliseconds(0)

    return {date: date.getTime(), hour}
  }

  utils.getReport = function ( query, cb ) {
    let { date, hour } = query
    let qstring = `${date}#${hour}`
    let c = reportCache.get( qstring )
    if (c)
      return cb(c)

    Report.findOne( {date, hour}, (err, doc) => {
      if ( err ) {
        debug('Error when finding report: ')
        debug(err)
        return cb(null)
      }
      reportCache.set( qstring, doc )
      cb(doc)
    })
  }

  utils.updateReport = function ( query, info, cb ) {
    let { date, hour } = query
    Report.findOne( {date, hour}, (err, doc) => {
      if (err)
        return cb(err)
      if ( !doc ) {
        utils.createReport( query, info, (err, doc) => {
          if (err) {
            debug("Failed to update report: ")
            debug(err)
            return cb(err)
          }
          cb(null, doc)
        })
      } else {
        for ( let type in info ) {
          if ( !info.hasOwnProperty(type) )
            continue
          let {ticks, totalTime} = info[type]
          let old = doc.langs.find(e => e.lang == type)
          if (old) {
            old.tick += ticks
            old.totalTime += totalTime
          } else {
            doc.langs.push( {
              lang: type,
              tick: ticks,
              totalTime
            })
          }
        }
        doc.save( (err, doc) => {
          if (err)
            return cb(err)
          reportCache.set( `${date}#${hour}`, doc )
          cb( null, doc )
        })
      }
    })
  }

  utils.createReport = function ( query, info, cb ) {
    let { date, hour } = query
    let record = { date, hour, langs: [] };
    for (let type in info) {
      if ( !info.hasOwnProperty(type) )
        continue
      let {ticks, totalTime} = info[type]
      record.langs.push( {lang:type, tick: ticks, totalTime} )
    }
    let report = new Report(record)
    report.save( (err, doc) =>{
      if (err)
        return cb(err, doc)
      reportCache.set( `${date}#${hour}`, doc );
      cb( null, doc )
    })
  }

  utils.getLang = function ( {date, lang}, cb ) {
    let qstring = `${date}#${lang}`
    let c = langCache.get( qstring )
    if (c)
      return cb(c)
    Lang.findOne( {date, lang}, (err, doc) => {
      if (err)
        return cb(err)
      langCache.set( qstring, doc )
      cb(null, doc)
    } )
  }

  return { Report, Lang, utils }
}
