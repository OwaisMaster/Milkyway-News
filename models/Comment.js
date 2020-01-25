var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var CommentSchema = new Schema({

    name: {
        type: String,
        default: "Anonymous"
    },

    comment: {
        type: String,
        required: true
    },

    articleID: {
        type: String,
        required: true
    }
});

var Comment = mongoose.model("Comment", CommentSchema);

module.exports = Comment;