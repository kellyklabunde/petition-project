const spicedPg = require("spiced-pg");

const db = spicedPg(
    process.env.DATABASE_URL ||
        "postgres:postgres:postgres@localhost:5432/petition"
);

module.exports.addSignature = (signature, user_id) => {
    return db.query(
        "INSERT INTO signatures (signature, user_id) VALUES ($1, $2) RETURNING id",
        [signature, user_id]
    );
};

module.exports.getSignature = (id) => {
    return db.query("SELECT signature FROM signatures WHERE id = $1", [id]);
};

module.exports.getSignaturesCount = () => {
    return db.query("SELECT COUNT(id) AS count FROM signatures");
};

module.exports.addUser = (first, last, email, hash) => {
    return db.query(
        "INSERT INTO users (first, last, email, hash) VALUES ($1, $2, $3, $4) RETURNING id",
        [first, last, email, hash]
    );
};

module.exports.getUserInfo = () => {
    return db.query("SELECT email, hash FROM users");
};

module.exports.checkEmail = (email) => {
    return db.query(
        `SELECT users.*, signatures.id AS signatureid FROM users LEFT JOIN signatures ON signatures.user_id = users.id WHERE email = $1`,
        [email]
    );
};

module.exports.getUserProfile = (age, city, url, user_id) => {
    return db.query(
        "INSERT INTO user_profiles (age, city, url, user_id) VALUES ($1, $2, $3, $4) RETURNING id",
        [age === "" ? null : age, city, url, user_id]
    );
};

module.exports.getSigners = () => {
    return db.query(
        `SELECT
    signatures.signature,
    users.first,
    users.last,
    user_profiles.age,
    user_profiles.city ,
    user_profiles.url
FROM 
    users 
JOIN signatures ON signatures.user_id = users.id
JOIN user_profiles ON user_profiles.user_id = users.id`
    );
};

module.exports.showProfile = (user_id) => {
    return db.query(
        `SELECT
    users.first,
    users.last,
    users.email,
    users.hash,
    user_profiles.age,
    user_profiles.city,
    user_profiles.url
FROM
    users
LEFT JOIN
    user_profiles ON users.id = user_profiles.user_id WHERE user_profiles.user_id = $1`,
        [user_id]
    );
};

module.exports.getSignersFilteredCity = (city) => {
    return db.query(
        "SELECT users.first, users.last, user_profiles.* FROM users JOIN user_profiles ON user_profiles.user_id = users.id WHERE LOWER(city) = LOWER($1)",
        [city]
    );
};

module.exports.getPassword = (user_id) => {
    return db.query("SELECT hash FROM users WHERE id = $1", [user_id]);
};

module.exports.deleteSignature = (user_id) => {
    return db.query("DELETE FROM signatures WHERE user_id = $1", [user_id]);
};

module.exports.updateUsersAndPassword = (first, last, email, hash, id) => {
    return db.query(
        "UPDATE users SET first = $1, last = $2, email = $3, hash = $4 WHERE users.id = $5",
        [first, last, email, hash, id]
    );
};

module.exports.updateOnlyUsers = (first, last, email, id) => {
    return db.query(
        "UPDATE users SET first = $1, last = $2, email = $3 WHERE users.id = $4",
        [first, last, email, id]
    );
};

module.exports.updateProfile = (age, city, url, user_id) => {
    return db.query(
        "INSERT INTO user_profiles(age, city, url, user_id) VALUES ($1, $2, $3, $4) ON CONFLICT(user_id) DO UPDATE SET age=$1, city=$2, url=$3",
        [age === "" ? null : age, city, url, user_id]
    );
};
