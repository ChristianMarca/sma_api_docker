
FROM mdillon/postgis:latest

ADD /restoreDB/ /docker-entrypoint-initdb.d/restoreDB

ADD /restoreDB/rbcompleto /docker-entrypoint-initdb.d
COPY ./dbInit.sh ./

ADD /tables/ /docker-entrypoint-initdb.d/tables/
ADD deploy_schemas.sql /docker-entrypoint-initdb.d/
