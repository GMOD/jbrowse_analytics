var args = require('optimist').argv;

if( args.user )
    process.setuid(args.user);
if( args.group )
    process.setgid(args.group);

var numWorkers = args.workers || args.w || 3;
var listenPort = args.port || args.p || 8080;
var bindAddress = args.bind || '127.0.0.1';
var http = require('http');
var mysql = require('mysql');
var ua_parser = require('ua-parser');
var url_parser = require('url');

var cluster = require('cluster');
if (cluster.isMaster) {
  // Fork workers.
  for (var i = 0; i < numWorkers; i++) {
    cluster.fork();
  }

  cluster.on('death', function(worker) {
    console.log('worker ' + worker.process.pid + ' died, spawning a replacement');
    setTimeout( function() {cluster.fork();}, 1000 );
  });
  console.log('Server running with '+numWorkers+' workers at http://'+bindAddress+':'+listenPort+'/');
} else {
    // worker
    console.log('worker '+process.pid+' started');
    var connection = mysql.createClient({
                                                host     : process.env.DBHOST || args.dbhost || 'localhost',
                                                port     : process.env.DBPORT || args.dbport || 3306,
                                                user     : process.env.DBUSER || args.dbuser || 'mysql',
                                                password : process.env.DBPASS || args.dbpass
                                            });

    if( args.dbname )
        connection.query('use '+args.dbname);

    http.createServer(function (req, res) {
        var url = url_parser.parse(req.url,true);

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


var insertQuery = "INSERT INTO jbrowse_client_log ("
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
                  + ",clientAddr"
                  + ",userAgent"
                  + ",uaFamily"
                  + ",uaMajor"
                  + ",uaMinor"
                  + ",uaPatch"
                  + ",os"
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
    stats.remoteAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    stats.userAgent = req.headers['user-agent'];
    stats.userAgentInfo = ua_parser.parse( stats.userAgent );
    stats.referer = req.headers['referer'];
    stats.acceptLanguage = req.headers['accept-language'];
    stats.acceptCharset = req.headers['accept-charset'];
    stats.host = stats.referer ? url_parser.parse(stats.referer).host : null;

    // construct JSON for the track types
    var trackTypes = {};
    var trackTypesRe = /^track-types-/;
    for( var key in stats ) {
        if( trackTypesRe.test( key ) ) {
            trackTypes[ key.replace( trackTypesRe, '') ] = parseInt(stats[key]);
        }
    }

    mysqlConnection.query( insertQuery,
        [
            stats['refSeqs-count'],
            stats['refSeqs-avgLen'],
            stats['tracks-count'],
            JSON.stringify( trackTypes ),
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
            stats.userAgentInfo.family,
            stats.userAgentInfo.major,
            stats.userAgentInfo.minor,
            stats.userAgentInfo.patch,
            stats.userAgentInfo.os,
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
