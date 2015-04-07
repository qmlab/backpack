function toPercent(input) {
  return (Math.floor(input * 10000 * 5) / 100) + '%'
}

function daysAgo(days) {
  var _date = new Date(new Date() - 1000 * 60 * 60 * 24 * days)
  var _year = _date.getFullYear()
  var _month = _date.getMonth()
  var _day = _date.getDate()
  return new Date(_year, _month, _day, 0, 0, 0, 0)
}
