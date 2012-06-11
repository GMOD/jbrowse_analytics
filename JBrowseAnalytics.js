var args = require('optimist').argv;

var numWorkers = args.workers || args.w || 3;
var listenPort = args.port || args.p || 8080;
var bindAddress = args.bind || '127.0.0.1';


var cluster = require('cluster');
if (cluster.isMaster) {
  // Fork workers.
  for (var i = 0; i < numWorkers; i++) {
    cluster.fork();
  }

  cluster.on('death', function(worker) {
    console.log('worker ' + worker.process.pid + ' died');
  });
  console.log('Server running with '+numWorkers+' workers at http://'+bindAddress+':'+listenPort+'/');
} else {
    // worker
    var http = require('http');
    var mysql = require('mysql');
    var connection = mysql.createClient({
                                                host     : args.dbhost || 'localhost',
                                                port     : args.dbport || 3306,
                                                user     : args.dbuser || 'mysql',
                                                password : args.dbpass
                                            });

    if( args.dbname )
        connection.query('use '+args.dbname);

    http.createServer(function (req, res) {
        var url = require('url').parse(req.url,true);

        if( url.pathname == '/analytics/clientReport' ) {
            res.writeHead(200, {'Content-Type': 'image/gif', Connection: 'close'});
            // serves a tiny empty gif and get rid of the client
            // before we actually do our work.
            res.end('\x47\x49\x46\x38\x39\x61\x01\x00\x01\x00\xf0\x01\x00\xff\xff\xff\x00\x00\x00\x21\xf9\x04\x01\x0a\x00\x00\x00\x2c\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02\x44\x01\x00\x3b', 'binary');
            recordStats( req, url, connection );
        } else {
            res.writeHead(404, {'Content-Type': 'text/plain'});
            res.end('Not found\n');
            console.log("Not found: "+req.url);
        }
    }).listen( listenPort, bindAddress );
}


var insertQuery = "INSERT INTO jbrowse_usage ("
                  + "refseqCount"
                  + ",refseqAvgLen"
                  + ",trackCount"
                  + ",trackTypes"
                  + ",screenHeight"
                  + ",screenWidth"
                  + ",windowHeight"
                  + ",windowWidth"
                  + ",elHeight"
                  + ",elWidth"
                  + ",reportTime"
                  + ",loadTime"
                  + ",remoteAddr"
                  + ",userAgent"
                  + ",referer"
                  + ",acceptLanguage"
                  + ",acceptCharset"
                  + ",host"
                  + ") VALUES ("
                  + "?"
                  + ",?"
                  + ",?"
                  + ",?"
                  + ",?"
                  + ",?"
                  + ",?"
                  + ",?"
                  + ",?"
                  + ",?"
                  + ",?"
                  + ",?"
                  + ",?"
                  + ",?"
                  + ",?"
                  + ",?"
                  + ",?"
                  + ",?"
                  + ")"
;

function recordStats ( req, parsedUrl, mysqlConnection ) {
    var stats = parsedUrl.query;

    // get some additional stats from the connection and the headers
    stats.remoteAddress = req.connection.remoteAddress;
    stats.userAgent = req.headers['user-agent'];
    stats.referer = req.headers['referer'];
    stats.acceptLanguage = req.headers['accept-language'];
    stats.acceptCharset = req.headers['accept-charset'];
    stats.host = req.headers.host;

    mysqlConnection.query( insertQuery,
        [
            stats['refSeqs-count'],
            stats['refSeqs-avgLen'],
            stats['tracks-count'],
            stats['tracks-types'],
            stats['scn-h'],
            stats['scn-w'],
            stats['win-h'],
            stats['win-w'],
            stats['el-h'],
            stats['eh-w'],
            stats['t'],
            stats['loadTime'],
            stats['remoteAddress'],
            stats['userAgent'],
            stats['referer'],
            stats['acceptLanguage'],
            stats['acceptCharset'],
            stats['host']
        ],
        function(err,results) {
            if( err ) throw err;
        }
    );
}
