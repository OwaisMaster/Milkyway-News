var express = require("express");
var exphbs = require("express-handlebars");
var mongoose = require("mongoose");

// Initialize Express
var app = express();
var PORT = process.env.PORT || 3000;

// Handlebars
app.engine(
    "handlebars",
    exphbs({
        defaultLayout: "main"
    })
);
app.set("view engine", "handlebars");

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Make public a static folder
app.use(express.static("public"));

// Routes
require("./routes/htmlRoutes")(app);

// Connect to the Mongo DB, unless deployed
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/milkywaynews";

mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

// Start the server
app.listen(PORT, function () {
    console.log("App running on port: " + PORT);
});

module.exports = app;