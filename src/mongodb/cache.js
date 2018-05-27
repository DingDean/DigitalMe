let Cache = function () {
  this.cache = {}
}
Cache.prototype.get = function (key) {
  return this.cache[key]
}

Cache.prototype.set = function (key, info) {
  this.cache[key] = info
}

module.exports = Cache
