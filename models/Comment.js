var mongoose = require("mongoose");

// Save a reference to the Schema constructor
var Schema = mongoose.Schema;

// Using the Schema constructor, a new CommentSchema object is created, similar to a Sequelize model
var CommentSchema = new Schema({
    // `name` must be of type String and has a default of "Anonymous"
    name: {
        type: String,
        default: "Anonymous"
    },
    // `comment` is required and must be of type String
    comment: {
        type: String,
        required: true
    },
    // `articleID` is required and must be of type String
    articleID: {
        type: String,
        required: true
    }
});

// This creates our model from the above schema, using mongoose's model method
var Comment = mongoose.model("Comment", CommentSchema);

// Export the Comment model
module.exports = Comment;