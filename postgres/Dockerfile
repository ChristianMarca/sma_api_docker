# FROM postgres:10.5



# ADD /tables/ /docker-entrypoint-initdb.d/tables/
# ADD /seed/ /docker-entrypoint-initdb.d/seed/
# ADD deploy_schemas.sql /docker-entrypoint-initdb.d/

FROM mdillon/postgis:latest

ADD /restoreDB/ /docker-entrypoint-initdb.d/restoreDB
# COPY /restoreDB/rbcompletod /docker-entrypoint-initdb.d/restoreDB/

ADD /restoreDB/rbcompleto /docker-entrypoint-initdb.d
# COPY /restoreDB/rbcompleto /docker-entrypoint-initdb.d
# RUN docker-entrypoint.sh

# ADD /restoreDB/rbcompleto /docker-entrypoint-initdb.d//
# RUN /docker-entrypoint.sh --help
# ADD create_postgis.sql /docker-entrypoint-initdb.d/
ADD /tables/ /docker-entrypoint-initdb.d/tables/
ADD deploy_schemas.sql /docker-entrypoint-initdb.d/