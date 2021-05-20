const express = require("express");
const cookieSession = require("cookie-session");
const exhb = require("express-handlebars");
const csurf = require("csurf");
const bcrypt = require("bcryptjs");

const db = require("./db");

let secret = "";

if (process.env.NODE_ENV === "production") {
    secret = process.env.secret;
} else {
    const secrets = require("./secrets.json");
    secret = secrets.secret;
}

const app = express();

app.engine("handlebars", exhb());
app.set("view engine", "handlebars");

app.use(express.static(__dirname + "/public"));

app.use(express.urlencoded({ extended: true }));

// Security
app.use(
    cookieSession({
        secret: secret,
        maxAge: 30 * 24 * 60 * 60 * 1000,
    })
);

app.use(csurf());

app.use((req, res, next) => {
    res.locals.csrfToken = req.csrfToken();

    next();
});

app.use((req, res, next) => {
    res.setHeader("X-Frame-Options", "DENY");

    next();
});

// Routes
app.get("/", (req, res) => {
    res.redirect("/registration");
});

//registration
app.get("/registration", (req, res) => {
    res.render("registration", {
        layout: "main",
    });
});

app.post("/registration", (req, res) => {
    console.log(req.body.password);
    bcrypt
        .hash(req.body.password, 12)
        .then((hash) => {
            console.log(hash);

            return db
                .addUser(req.body.first, req.body.last, req.body.email, hash)
                .then((result) => {
                    req.session.userId = result.rows[0].id;
                    req.session.signatureId = undefined;
                    res.redirect("/profile");
                });
        })
        .catch((err) => {
            console.log(err);
            res.render("registration", {
                layout: "main",
                error: "true",
            });
        });
});

//login
app.get("/login", (req, res) => {
    res.render("login", {
        layout: "main",
    });
});

app.post("/login", (req, res) => {
    db.checkEmail(req.body.email).then((result) => {
        if (result.rows[0]) {
            const hashFromDb = result.rows[0].hash;
            bcrypt.compare(req.body.password, hashFromDb).then((match) => {
                console.log("match", match);
                if (typeof result.rows[0] != "undefined") {
                    req.session.userId = result.rows[0].id;
                }
                if (match) {
                    db.checkIfSigned(result.rows[0].id).then(({ rows }) => {
                        console.log(typeof rows[0]);
                        const signcheck = "";
                        if (typeof rows[0] != "undefined") {
                            req.session.signatureId = rows[0].id;
                            signcheck = rows[0].signature;
                        }
                        if (signcheck == "undefined") {
                            res.redirect("/petition");
                        } else {
                            res.redirect("/thanks");
                        }
                    });
                } else {
                    res.render("login", {
                        layout: "main",
                        error: "true",
                    });
                }
            });
        } else {
            res.render("login", {
                layout: "main",
                error: "true",
            });
        }
    });
});

//logout
app.get("/logout", (req, res) => {
    req.session = null;
    res.redirect("/registration");
});

//profile
app.get("/profile", (req, res) => {
    res.render("profile", {
        layout: "main",
    });
});

app.post("/profile", (req, res) => {
    return db
        .getUserProfile(
            req.body.age,
            req.body.city,
            req.body.url,
            req.session.userId
        )
        .then(() => {
            res.redirect("/petition");
        })
        .catch((err) => {
            console.log(err);
            res.render("profile", {
                layout: "main",
                error: "true",
            });
        });
});

//edit profile
app.get("/profile/edit", (req, res) => {
    console.log(req.session.userId);
    return db
        .showProfile(req.session.userId)
        .then((result) => {
            console.log(result.rows);
            res.render("edit", {
                layout: "main",
                first: result.rows[0].first,
                last: result.rows[0].last,
                email: result.rows[0].email,
                hash: result.rows[0].hash,
                age: result.rows[0].age,
                city: result.rows[0].city,
                url: result.rows[0].url,
            });
        })
        .catch((err) => {
            console.log(err);
            res.render("edit", {
                layout: "main",
                error: "true",
            });
        });
});

app.post("/profile/edit", (req, res) => {
    if (req.body.password) {
        console.log(req.body.password);
        bcrypt.hash(req.body.password, 12).then((hash) => {
            console.log(hash);
            db.updateUsersAndPassword(
                req.body.first,
                req.body.last,
                req.body.email,
                hash,
                req.session.userId
            ).then((result) => {
                db.updateProfile(
                    req.body.age,
                    req.body.city,
                    req.body.url,
                    req.session.userId
                ).then((result) => {
                    //console.log(result);
                    res.redirect("/thanks");
                });
            });
        });
    } else {
        db.updateOnlyUsers(
            req.body.first,
            req.body.last,
            req.body.email,
            req.session.userId
        ).then((result) => {
            db.updateProfile(
                req.body.age,
                req.body.city,
                req.body.url,
                req.session.userId
            ).then(() => {
                res.redirect("/thanks");
            });
        });
    }
});

//petition
app.get("/petition", (req, res) => {
    console.log("signatureID", req.session.signatureId);

    if (req.session.signatureId) {
        return res.redirect("/thanks");
    }

    res.render("petition", {
        layout: "main",
    });
});

app.post("/petition", (req, res) => {
    console.log(req.session.userId);
    console.log(req.body);
    db.addSignature(req.body.signature, req.session.userId)
        .then((result) => {
            console.log("signature added with id: ", result.rows[0].id);

            req.session.signatureId = result.rows[0].id;

            res.redirect("/thanks");
        })
        .catch((err) => {
            console.log(err);
            res.render("petition", {
                layout: "main",
                error: "true",
            });
        });
});

//thanks
app.get("/thanks", (req, res) => {
    console.log("thanks page");
    if (!req.session.signatureId) {
        return res.redirect("/petition");
    }
    console.log(req.session.signatureId);

    db.getSignature(req.session.signatureId).then((result) => {
        let signature = result.rows[0].signature;
        db.getSignaturesCount()
            .then((result) => {
                res.render("thanks", {
                    signature: signature,
                    count: result.rows[0].count,
                });
            })
            .catch((err) => {
                console.log(err);
                res.sendStatus(500);
            });
    });
});

app.post("/thanks", (req, res) => {
    db.deleteSignature(req.session.userId)
        .then(() => {
            req.session.signatureId = null;
            res.redirect("/petition");
        })
        .catch((err) => {
            console.log(err);
            res.sendStatus(500);
        });
});

//signers
app.get("/signers", (req, res) => {
    if (!req.session.signatureId) {
        return res.redirect("/petition");
    }

    db.getSigners()
        .then((result) => {
            res.render("signers", {
                signers: result.rows,
                count: result.rows.length,
            });
        })
        .catch((err) => {
            console.log(err);
            res.sendStatus(500);
        });
});

app.get("/signers/:city", (req, res) => {
    if (!req.session.signatureId) {
        return res.redirect("/petition");
    }
    db.getSignersFilteredCity(req.params.city)
        .then((result) => {
            console.log(result.rows);
            res.render("signers", {
                signers: result.rows,
                count: result.rows.length,
                city: result.rows[0].city,
            });
        })
        .catch((err) => {
            console.log(err);
            res.sendStatus(500);
        });
});

app.listen(process.env.PORT || 3000, () =>
    console.log("Petition is listening on localhost:3000")
);
