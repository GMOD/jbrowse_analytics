if [ `whoami` = 'root' ]; then
    /usr/local/bin/node JBrowseAnalytics.js \
	--user USERNAME \
	--bind 127.0.0.1 \
	--port 3003 \
	-w 4 \
	--dbhost localhost \
	--dbname jbrowse_analytics \
	--dbuser DATABASE_USER \
	--dbpass DATABASE_PASSWORD;
else
    echo Please run this as: sudo ./run.sh;
fi;
