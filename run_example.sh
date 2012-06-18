if [ `whoami` = 'root' ]; then
    DBPASS=DATABASE_PASSWORD /usr/local/bin/node JBrowseAnalytics.js \
	--user USERNAME \
	--bind 127.0.0.1 \
	--port 3003 \
	-w 4 \
	--dbhost localhost \
	--dbname jbrowse_analytics \
	--dbuser DATABASE_USER
else
    echo Please run this as: sudo ./run.sh;
fi;
