var mongoose = require("mongoose");

// Save a reference to the Schema constructor
var Schema = mongoose.Schema;

// Using the Schema constructor, a new ArticleSchema object is created, similar to a Sequelize model
var ArticleSchema = new Schema({
    // `headline` must be unique and of type String
    headline: {
        type: String,
        unique: true
    },
    // `byline` must be of type String and has a default of "Anonymous" (if it is read as "undefined")
    updated: {
        type: String,
        default: "Anonymous"
    },
    // `tag` must be a String
    tag: String,
    // `articleLink` must be unique and of type String
    articleLink: {
        type: String,
        unique: false
    },
    // `imageSrc` must be a String (didn't get to this, but will add later if possible)
    imageSrc: String,
    // `summary` must be a String
    summary: String,
    // `comments` is an array that stores ObjectIds
    // The ref property links these ObjectIds to the Comment model
    // This allows us to populate the Article with any associated Comments
    comments: [
        {
            // Store ObjectIds in the array
            type: Schema.Types.ObjectId,
            // The ObjectIds will refer to the ids in the Comment model
            ref: "Comment"
        }
    ]
});

// This creates our model from the above schema, using mongoose's model method
var Article = mongoose.model("Article", ArticleSchema);

// Export the Article model
module.exports = Article;