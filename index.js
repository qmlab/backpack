var express = require('express')
, bodyParser = require('body-parser')
, nconf = require('nconf')
, compress = require('compression')
, path = require('path')
, mailer = require('nodemailer')
, vhost = require('vhost')
, fs = require('fs')
, timespan = require('timespan')
, http = require('http')
, https = require('https')


// First consider commandline arguments and environment variables, respectively.
nconf.argv().env();

// Whether this is debug or release
var isDebug = false

if (nconf.get('debug')) {
  console.log('debug mode')
  isDebug = true
}

if (!isDebug) {
  // Provide configs for release
  nconf.file({ file: 'config.release.json' });
}
else {
  // Provide configs for release
  nconf.file({ file: 'config.debug.json' });
}


/// ============================ Backpack ==============================

// backpack web app
var backpack = express()

// Init compression management
if (nconf.get('server:compress')) {
  backpack.use(compress())
}

// For rendering views
backpack.set('views', __dirname + '/backpack')
backpack.engine('html', require('ejs').renderFile);
backpack.set('view engine', 'ejs');

// For static html
backpack.use(express.static(path.join(__dirname, 'backpack')));

// Init body-parser
backpack.use(bodyParser.urlencoded({
  extended: true
}))
backpack.use(bodyParser.json({
}))

backpack.get('/', function(req, res) {
  res.redirect(301, '/home')
})

backpack.get('/home', function(req, res) {
  res.render('home.html')
})

backpack.get('/tutorial', function(req, res) {
  res.render('tutorial.html')
})

backpack.get('/documentation', function(req, res) {
  res.render('documentation.html')
})

backpack.get('/contact', function(req, res) {
  res.render('contact.html')
})

backpack.post('/feedback', function(req, res) {
  var username = nconf.get('gmail_user')
  var passwd = nconf.get('gmail_password')
  // Use Smtp Protocol to send Email
  var smtpTransport = mailer.createTransport({
    service: 'Gmail',
    auth: {
      user: username + '@gmail.com',
      pass: passwd
    }
  });

  var mail = {
    from: req.body.from,
    to: username + '@gmail.com',
    subject: req.body.subject,
    text: 'from: ' + req.body.from + '\r\nmessage: ' + req.body.email,
    html: ''
  }

  smtpTransport.sendMail(mail, function(error, response){
    if(error){
      res.send(error);
    }else{
      res.send('Message sent!');
    }

    smtpTransport.close();
  });
})





/// ============================== Nobet ================================
var nobet = express()

// parse application/x-www-form-urlencoded
nobet.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
nobet.use(bodyParser.json())


// For rendering views
nobet.set('views', __dirname + '/nobet')
nobet.engine('html', require('jade').__express);
nobet.set('view engine', 'jade');

// For static html
nobet.use(express.static(path.join(__dirname, 'public')));

// Routing
nobet.get('/', function(req, res) {
  res.render('index.jade')
})

var recordCache = {}
var totalCache = {}

// Proxy
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
nobet.route('/records')
.post(function(req, res, next) {
  var username = nconf.get('apikey')
  var password = nconf.get('password')
  var queryPath = '/store/set/goodbet/items?1=1'
  if (!!req.query.orderby) {
    queryPath += '&orderby=' + req.query.orderby
  }
  if (!!req.query.desc) {
    queryPath += '&desc=' + req.query.desc
  }
  if (!!req.query.asc) {
    queryPath += '&asc=' + req.query.asc
  }
  var options = {
    hostname: 'backpack.ddns.net',
    port: 443,
    path: queryPath,
    method: 'POST',
    auth: username + ':' + password,
    headers: {
      'Content-Type': 'application/json',
      'Keep-Alive': false
    }
  }

  var query = Object.keys(req.body)[0]
  var now = new Date()
  if (!!recordCache[query] && timespan.fromDates(recordCache[query].time, now).minutes < 10) {
    res.write(recordCache[query].data)
    res.status(200).end()
  }
  else {
    recordCache[query] = {
      data: '',
      time: now
    }
    var _req = https.request(options, function(_res) {
      _res.setEncoding('utf8')
      _res.on('data', function(data) {
        recordCache[query] = {
          data: recordCache[query].data + data,
          time: now
        }
        res.write(data)
        next()
      })
      _res.on('close', function() {
        res.status(_res.statusCode).end()
      })
      _res.on('end', function() {
        res.status(_res.statusCode).end()
      })
    }).on('error', function(e) {
      delete recordCache[query]
      res.writeHead(500)
      console.error(e.message)
      res.end()
    })

    if (typeof query !== 'undefined') {
      _req.write(query)
    }
    _req.end()
  }
})

nobet.route('/total')
.post(function(req, res, next) {
  var username = nconf.get('apikey')
  var password = nconf.get('password')
  var queryPath = '/store/set/goodbet/count'
  var options = {
    hostname: 'backpack.ddns.net',
    port: 443,
    path: queryPath,
    method: 'POST',
    auth: username + ':' + password,
    headers: {
      'Content-Type': 'application/json',
      'Keep-Alive': false
    }
  }

  var query = Object.keys(req.body)[0]
  var now = new Date()
  if (!!totalCache[query] && timespan.fromDates(totalCache[query].time, now).minutes < 10) {
    res.write(totalCache[query].data)
    res.status(200).end()
  }
  else {
    totalCache[query] = {
      data: '',
      time: now
    }

    var _req = https.request(options, function(_res) {
      _res.setEncoding('utf8')
      _res.on('data', function(data) {
        totalCache[query] = {
          data: totalCache[query].data + data,
          time: now
        }
        res.write(data)
        next()
      })
      _res.on('close', function() {
        res.status(_res.statusCode).end()
      })
      _res.on('end', function() {
        res.status(_res.statusCode).end()
      })
    }).on('error', function(e) {
      delete totalCache[query]
      res.writeHead(500)
      console.error(e.message)
      res.end()
    })

    var query = Object.keys(req.body)[0]
    if (typeof query !== 'undefined') {
      _req.write(query)
    }
    _req.end()
}
})




/// ============================ vhost =================================
var app = module.exports = express()
app.use(vhost('backpack.ddns.net', backpack))
app.use(vhost('nobet.ddns.net', nobet))
var server = http.createServer(app)
var port = nconf.get('port')
server.listen(port, function() {
  console.log('Debug: server listening at port %d', port)
})
