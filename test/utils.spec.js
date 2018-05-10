const utils = require('../src/utils.js')
const assert = require('assert')

describe('utils', function () {
  var base = 690393600000
  var hour = 3600000
  let history = [
    {filetype: 'js', ticks: 1, start: base, lastTick: base+ 800}, // 1991-11-18 0
    {filetype: 'md', ticks: 2, start: base, lastTick: base + 2 * hour}, // 1991-11-18 2
    {filetype: 'js', ticks: 1, start: base + 800, lastTick: base + 900}
  ]

  describe('parseForReport', function () {
    it(
      `should return a object with structure:
      {
        "xxx": {date: Number, hour: Number, langs: [{type, ticks, duration}]
      }
      `,
      function () {
        let result = utils.parseForReport( history )
        assert( result.hasOwnProperty( `${base}#0` ) )
        assert( result.hasOwnProperty( `${base}#2` ) )
        let info = result[`${base}#0`]
        assert.equal( info.date, base )
        assert.equal( info.hour, 0 )
        assert.equal( info.langs.length, 1 )
        let lang = info.langs[0]
        assert.equal( lang.type, 'js' )
        assert.equal( lang.ticks, 2 )
        assert.equal( lang.duration, 900 )
    })
  })


  describe('parseForLangs', function () {
    var langs
    before(function () {
      langs = utils.parseForLangs( history )
    })

    it('should return an object', function () {
      assert.equal( typeof langs, 'object' )
    })

    it('with property name in date#ftype', function () {
      assert( langs.hasOwnProperty( `${base}#js` ) )
      assert( langs.hasOwnProperty( `${base}#md` ) )
    })

    it('each with value of {date, ftype, ticks, duration}', function () {
      let jsinfo = langs[`${base}#js`]
      assert.equal( jsinfo.date, base )
      assert.equal( jsinfo.ftype, 'js' )
      assert.equal( jsinfo.ticks, 2 )
      assert.equal( jsinfo.duration, 900 )
    })
  })

  describe('getQueryPath', function () {
    it('should return an object with date and index property', function () {
      let ts = 690393600000 //1991-11-18 00:00:00 GMT8
      let tss = ts + 2 * 60* 60 * 1000 // 1991-11-18 02:00:00 GMT8
      let { date, hour } = utils.getQueryPath( tss )
      assert.equal( date, ts )
      assert.equal( hour, 2 )
    })
    it('should behave well with edge time', function () {
      let ts = 690393600000 //1991-11-18 00:00:00 GMT8
      let { date, hour } = utils.getQueryPath( ts )
      assert.equal( date, ts )
      assert.equal( hour, 0 )
    })
    it('should behave well with any time', function () {
      let ts = 1525791392980 //2018-05-08
      let { date, hour } = utils.getQueryPath( ts )
      assert.equal( date, 1525708800000 )
      assert.equal( hour, 22 )
    })
    it('should behave well with any time', function () {
      let ts = 1525791666271 //2018-05-08
      let { date, hour } = utils.getQueryPath( ts )
      assert.equal( date, 1525708800000 )
      assert.equal( hour, 23 )
    })
  })
})
