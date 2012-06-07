This is a nodejs-based server for handling usage reports coming in
from JBrowse instances.

Loads the usage data into a single PostgreSQL database table.

Run as:

    # listen to localhost, port 3030, with 4 worker processes
    node JBrowseAnalytics.js --bind 127.0.0.1 --port 3030 --workers 4 --db 'tcp/postgres_user:postgres_password@postgres.example.com/dbname'

