-- CREATE USER postgres PASSWORD 'secret_password';
-- ALTER USER postgres WITH SUPERUSER;

-- CREATE DATABASE sma_api_test;
-- GRANT ALL PRIVILEGES ON DATABASE sma_api_test TO postgres;
-- \connect sma_api_test postgres
CREATE EXTENSION postgis;

-- CREATE DATABASE tests;
-- GRANT ALL PRIVILEGES ON DATABASE tests TO simon;
-- \connect tests simon
-- CREATE EXTENSION postgis;