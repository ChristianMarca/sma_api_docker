cd docker-entrypoint-initdb.d/restoreDB

pg_restore -U postgres --dbname=sma_api --verbose --clean < rbcompleto

psql -U postgres -d sma_api -f '/docker-entrypoint-initdb.d/tables/seeds.sql'

exit