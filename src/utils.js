function parseForReport ( history ) {
  let info = {}
  history.forEach( h => {
    let {filetype, ticks, start, lastTick} = h
    let duration = lastTick - start

    let {date, hour} = getQueryPath( lastTick )
    let qstring = `${date}#${hour}`
    if (info.hasOwnProperty( qstring )) {
      let lang = info[qstring].langs.find( e => e.type == filetype )
      if (lang) {
        lang.ticks += ticks
        lang.duration += duration
      } else {
        info[qstring].langs.push({
          type: filetype,
          ticks, duration
        })
      }
    } else {
      info[qstring] = { date, hour, langs: [{
        type: filetype,
        ticks, duration
      }] }
    }
  })
  return info
}

function parseForLangs  ( history ){
  let info = {}
  history.forEach( session => {
    let {filetype:ftype, ticks, start, lastTick} = session
    let duration = lastTick - start
    let {date} = getQueryPath( lastTick )

    let qs = `${date}#${ftype}`
    if ( info.hasOwnProperty(qs) ) {
      info[qs].ticks += ticks
      info[qs].duration += duration
    } else {
      info[qs] = {date, ftype, ticks, duration}
    }
  })
  return info
}

/**
 * Given a timestamp, get the date value for query and index for hour
 *
 * @param {Number} ts timestamp of a session
 * @returns {Object} {query, index}
 */
function getQueryPath ( ts ) {
  let date = new Date(ts)
  let hour = date.getHours()
  date.setHours(0)
  date.setMinutes(0)
  date.setSeconds(0)
  date.setMilliseconds(0)

  return {date: date.getTime(), hour}
}

module.exports = {parseForReport, parseForLangs, getQueryPath}
