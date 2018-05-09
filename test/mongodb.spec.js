const sinon = require('sinon')
const assert = require('assert')
const mongodb = require('../src/mongodb.js')({model: _ => _, Schema:
  _=>_})

describe('Mongodb service', function () {
  describe('utils', function () {
    describe('getQueryPath', function () {
      it('should return an object with date and index property', function () {
        let ts = 690393600000 //1991-11-18 00:00:00 GMT8
        let tss = ts + 2 * 60* 60 * 1000 // 1991-11-18 02:00:00 GMT8
        let { date, hour } = mongodb.utils.getQueryPath( tss )
        assert.equal( date, ts )
        assert.equal( hour, 2 )
      })
      it('should behave well with edge time', function () {
        let ts = 690393600000 //1991-11-18 00:00:00 GMT8
        let { date, hour } = mongodb.utils.getQueryPath( ts )
        assert.equal( date, ts )
        assert.equal( hour, 0 )
      })
      it('should behave well with any time', function () {
        let ts = 1525791392980 //2018-05-08
        let { date, hour } = mongodb.utils.getQueryPath( ts )
        assert.equal( date, 1525708800000 )
        assert.equal( hour, 22 )
      })
      it('should behave well with any time', function () {
        let ts = 1525791666271 //2018-05-08
        let { date, hour } = mongodb.utils.getQueryPath( ts )
        assert.equal( date, 1525708800000 )
        assert.equal( hour, 23 )
      })
    })

    describe('updateReport', function () {
      it('should query against date and update the hours by the index', function () {
      })
    })
  })
})
