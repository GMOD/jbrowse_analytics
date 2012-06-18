#!/bin/sh
# based on https://gist.github.com/2237629

#
# chkconfig: 35 99 99
# description: Node.js JBrowse analytics server
#
. /etc/rc.d/init.d/functions

# Creamos un fichero PID para monit
SCRIPT="JBrowseAnalytics.js"

USER="jb_analytics"
PGREP_ARGS="-u $USER -f $SCRIPT"

ROOT_DIR="/var/www/jbrowse_analytics"

SERVER="JBrowse analytics"
LOG_FILE="$ROOT_DIR/JBrowseAnalytics.log"

do_start()
{
        if pgrep $PGREP_ARGS; then
                echo "$SERVER is already running."
                RETVAL=1
	else
                echo -n $"Starting $SERVER: "
                cd $ROOT_DIR && ./run.sh 2>&1 | ( while read line; do echo "$(date): ${line}"; done ) >> $LOG_FILE &
                if [ $? -eq 0 ]; then
		    echo_success;
		else
		    echo_failure;
		fi;
                echo
        fi
}
do_stop()
{
        echo -n $"Stopping $SERVER: "
        pkill $PGREP_ARGS >/dev/null 2>&1 && echo_success || echo_failure;
        RETVAL=$?
	echo
}

case "$1" in
        start)
                do_start
                ;;
        stop)
                do_stop
                ;;
        restart)
                do_stop
                do_start
                ;;
        *)
                echo "Usage: $0 {start|stop|restart}"
                RETVAL=1
esac

exit $RETVAL
