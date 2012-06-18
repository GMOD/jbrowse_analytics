#!/bin/sh
# based on https://gist.github.com/2237629

#
# chkconfig: 35 99 99
# description: Node.js JBrowse analytics server
#
. /etc/rc.d/init.d/functions

# Creamos un fichero PID para monit
SCRIPT="JBrowseAnalytics.js"
PIDFILE="/var/run/jbrowse_analytics.pid"

USER="jb_analytics"
PGREP_ARGS="-u $USER -f $SCRIPT"

ROOT_DIR="/var/www/jbrowse_analytics"

SERVER="JBrowse analytics"
LOG_FILE="$ROOT_DIR/JBrowseAnalytics.log"
LOCK_FILE="/var/lock/subsys/jbrowse_analytics"

do_start()
{
        if [ ! -f "$LOCK_FILE" ] ; then
                echo -n $"Starting $SERVER: "
                cd $ROOT_DIR && ./run.sh 2>&1 | ( while read line; do echo "$(date): ${line}"; done ) >> $LOG_FILE &
                if [ $? -eq 0 ]; then
		    sleep 1;
		    pgrep $PGREP_ARGS > $PIDFILE;
		    touch $LOCK_FILE;
		    echo_success;
		else
		    echo_failure;
		fi;
                echo
        else
                echo "$SERVER is already running."
                RETVAL=1
        fi
}
do_stop()
{
        echo -n $"Stopping $SERVER: "
        kill `cat "$PIDFILE" 2>/dev/null` >/dev/null 2>&1 && echo_success || echo_failure;
        RETVAL=$?
	echo
        [ $RETVAL -eq 0 ] && rm -f $LOCK_FILE $PIDFILE
        rm -f "$PIDFILE";
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
