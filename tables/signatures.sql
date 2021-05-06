-- whenever you make any update to this file,
-- you need to RUN the file again with `psql -d petition -f tables/signatures.sql || heroku pg:psql -f tables/signatures.sql` 

DROP TABLE IF EXISTS signatures;
DROP TABLE IF EXISTS user_profiles;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    first VARCHAR NOT NULL CHECK (first != ''),
    last VARCHAR NOT NULL CHECK (last != ''),
    email VARCHAR NOT NULL CHECK (last != ''),
    hash VARCHAR NOT NULL CHECK (last != ''),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE signatures (
    id SERIAL PRIMARY KEY,
    signature VARCHAR NOT NULL CHECK (signature != ''),
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_profiles(
    id SERIAL PRIMARY KEY,
    age INT,
    city VARCHAR(100),
    url VARCHAR(300),
    user_id INT REFERENCES users(id) NOT NULL UNIQUE
);

-- CREATE TABLE test (
--     name VARCHAR
-- );

