const debug = require('debug')('mongo:tomato')
const mongoose = require('mongoose')
// const Cache = require('./cache.js')
// const cache = new Cache()

const Tomato = mongoose.model('Tomato', mongoose.Schema({
  date: Number,
  type: Number, // 0-finished, 1-abandoned
  tStart: Number,
  tEnd: Number
}))

function updateTomatos (tomatos) {
  tomatos.forEach(tomato => {
    let record = new Tomato(tomato)
    record.save((err, doc) => {
      if (err)
        return debug(err)
    })
  })
}
exports.updateTomatos = updateTomatos
