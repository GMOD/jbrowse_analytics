var args = require('optimist').argv;

var numWorkers = args.w || 3;
var listenPort = args.p || 8080;
var bindAddress = args.a || '127.0.0.1';

var pgConnString = args.d;
if( !pgConnString )
    throw("must provide a -d argument");

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
    var pg = require('pg');

    pg.connect( pgConnString, function(err, client) {
        client.on('error', function(err) {
            console.log(err);
        });

        http.createServer(function (req, res) {
            var url = require('url').parse(req.url,true);

            if( url.pathname == '/analytics/clientReport' ) {
                res.writeHead(
                    200,
                    { 'Content-Type': 'application/x-javascript',
                      'Access-Control-Allow-Origin': '*'
                    });
                // get rid of the client before we actually do our work.
                res.end('\n');
                recordStats( req, url, client );
            } else {
                res.writeHead(404, {'Content-Type': 'text/plain'});
                res.end('Not found\n');
                console.log("Not found: "+req.url);
            }
        }).listen( listenPort, bindAddress );
    });

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
                  + "$1"
                  + ",$2"
                  + ",$3"
                  + ",$4"
                  + ",$5"
                  + ",$6"
                  + ",$7"
                  + ",$8"
                  + ",$9"
                  + ",$10"
                  + ",TIMESTAMP WITH TIME ZONE 'epoch' + $11 * INTERVAL '1 second'"
                  + ",$12"
                  + ",$13"
                  + ",$14"
                  + ",$15"
                  + ",$16"
                  + ",$17"
                  + ",$18"
                  + ")"
;

function recordStats ( req, parsedUrl, pgClient ) {
    var stats = parsedUrl.query;

    // get some additional stats from the connection and the headers
    stats.remoteAddress = req.connection.remoteAddress;
    stats.userAgent = req.headers['user-agent'];
    stats.referer = req.headers['referer'];
    stats.acceptLanguage = req.headers['accept-language'];
    stats.acceptCharset = req.headers['accept-charset'];
    stats.host = req.headers.host;

    pgClient.query({
        name: 'insert usage',
        text: insertQuery,
        values: [
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
        ]
    });
}
