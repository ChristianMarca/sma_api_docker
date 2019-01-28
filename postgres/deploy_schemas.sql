-- Deploy fresh database tables
-- \i ' | docker exec -i your-db-container psql -U postgres
\i '/docker-entrypoint-initdb.d/restoreDB/init.sql'
\i '/docker-entrypoint-initdb.d/tables/migrations.sql'
\i '/docker-entrypoint-initdb.d/tables/storedProcedures.sql'