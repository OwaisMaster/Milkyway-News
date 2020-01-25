var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var ArticleSchema = new Schema({

    headline: {
        type: String,
        unique: true
    },

    updated: {
        type: String,
        default: "Anonymous"
    },

    tag: String,

    articleLink: {
        type: String,
        unique: true
    },

    imageSrc: String,

    summary: String,

    comments: [
        {
            // Store ObjectIds in the array
            type: Schema.Types.ObjectId,
            // The ObjectIds will refer to the ids in the Comment model
            ref: "Comment"
        }
    ]
});

var Article = mongoose.model("Article", ArticleSchema);

module.exports = Article;