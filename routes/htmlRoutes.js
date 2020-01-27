var db = require("../models");

var axios = require("axios");
var cheerio = require("cheerio");

module.exports = app => {
    var results = [];

    console.log("Loading . . . .");

    //Route when webpage first loaded
    app.get("/" || "*", (req, res) => {
        console.log("Retrieving articles...");
        //Axios scrapes the Reuters World News website
        axios.get("https://www.reuters.com/news/world").then(response => {

            var $ = cheerio.load(response.data);

            var result = {};


            // Now, we grab the headline, time updated, tag, article link, image src and summary from every FeedItem element
            $(".FeedItem_item").each((i, element) => {
                //The loop stops after nine articles
                if (results.length > 9) {
                    return false;
                }

                var headline = $(element).find("h2").text().trim();
                var date = $(element).find(".FeedItemMeta_date-updated").text().trim();
                var tag = $(element).find(".FeedItemMeta_channel").text().trim();
                var articleLink = $(element).find("h2>a").attr("href");
                var imageSrc = $(element).find("img").attr("src");
                var summary = $(element).find("p.FeedItemLede_lede").text().trim();

                // Add the headline, updated time, tag, article link, image src, and summary, and save them as properties of the result object
                result = {
                    headline: headline,
                    updated: date,
                    tag: tag,
                    articleLink: articleLink,
                    imageSrc: imageSrc,
                    summary: summary
                };
                //Push each result(article) to the results(articles) array
                results.push(result);

                if (tag == null) {
                    tag = "None";
                }

                if (articleLink === undefined) {
                    articleLink = "https://duckduckgo.com/" + results.length;
                }

                if (headline && articleLink && summary) {
                    db.Article.updateOne({ headline: headline, articleLink: articleLink }, result, { upsert: true })
                        .catch(err => {
                            console.log(err);
                        })
                }
            });
        });

        var articles = [];
        db.Article.find({}).lean().populate("comments").then(data => {
            for (var i = 0; i < data.length; i++) {
                data[i].iterator = i;
            }

            //Creates a tags array of all the tags without any repeats
            const tags = [...new Set(data.map(a => a.tag))];

            //Creates article object for each article and pushes to articles array
            data.map(article => articles.push(article = {
                headline: article.headline,
                updated: article.updated,
                tag: article.tag,
                articleLink: article.articleLink,
                imageSrc: article.imageSrc,
                summary: article.summary,
                comments: article.comments,
                _id: article._id
            }));

            tags.sort();
            const objTags = [];
            //Puts each tag from the tags array into an object in the objTags array
            tags.forEach(tag => objTags.push({ tagName: tag }));

            //Creates an updatedTimes array of all the times
            const updatedTimes = [...new Set(data.map(a => a.postUpdate))];
            updatedTimes.sort();
            const objUpdatedTimes = [];
            //Puts each time from the updatedTimes array into an object in the objUpdatedTimes array
            updatedTimes.forEach(postUpdate => objUpdatedTimes.push({ updatedPost: postUpdate }));

            //The objTags and the objUpdated arrays are for the tag and updated time columns
            res.render("index", { articles: articles.reverse(), tagList: objTags, updateList: objUpdatedTimes, display1: "block" });

        })
            .catch(err => {
                res.json(err);
            });
    });

    //Route for all articles in json
    app.get("/a", (req, res) => {
        db.Article.find({}, (err, data) => {
            if (err) {
                console.log(err);
            }
            else {
                res.json(data);
            }
        });
    });

    //Route for all comments in json
    app.get("/acoms", (req, res) => {
        db.Comment.find({}, (err, data) => {
            if (err) {
                console.log(err);
            }
            else {
                res.json(data);
            }
        });
    });

    //Route for when a particular tag is clicked
    app.get("/tags/:tagName", (req, res) => {
        let tagName = req.params.tagName;
        var tagged = [];
        var commentList = [];

        //Find all articles with the specified tag name
        db.Article.find({ tag: tagName }).lean().populate("comments").then(data => {
            for (var i = 0; i < data.length; i++) {
                data[i].iterator = i;
            }
            //Creates object for each article and pushes it into the tagged array
            data.map(article => tagged.push(
                {
                    headline: article.headline,
                    updated: article.updated,
                    tag: article.tag,
                    articleLink: article.articleLink,
                    imageSrc: article.imageSrc,
                    summary: article.summary,
                    _id: article._id,
                    comments: article.comments
                }
            ));

            //Find all articles to display different tags
            db.Article.find({}).lean().populate("comments").then(allData => {
                const tags = [...new Set(allData.map(a => a.tag))];
                tags.sort();
                const objTags = [];
                tags.forEach(tag => objTags.push({ tagName: tag }));

                res.render("index", { articles: tagged.reverse(), tagList: objTags, comments: commentList, display1: "block" });
            })

        })
            .catch(err => {
                res.json(err);
            });
    });

    //Route for uploading comment to database
    app.post("/submitComment/articles/:id", (req, res) => {
        var id = req.params.id;
        console.log(id);
        console.log(req.body);

        if (req.body.name == "") {
            req.body.name = "Anonymous";
        };

        db.Comment.create(req.body)
            .then(dbComment => {
                console.log("dbComment._id: " + dbComment._id);

                // If comment was created successfully, find its article using the id and push the new Comment's _id to the Article's comments array
                // { new: true } tells the query to return the updated Article -- returns the original by default
                return db.Article.findByIdAndUpdate(id, { $push: { comments: dbComment._id } }, { new: true });
            })
            .then(dbArticle => {
                res.send(dbArticle);
            })
            .catch(err => {
                res.send(err);
            });
    });

    //Route for deleting a comment
    app.post("/deleteComment/:articleID/comments/:id", (req, res) => {
        var id = req.params.id;
        var articleID = req.params.articleID;
        console.log("articleID: " + articleID);
        console.log("id: " + id);
        console.log(req.body);

        db.Comment.findByIdAndRemove(id, (err, data) => {

            if (err) return res.status(500).send(err);
            console.log("data._id: " + data._id);

        }).then(data2 => {
            //Find the specific article by its id and update its comments array, pulling out the deleted comment's id
            return db.Article.findByIdAndUpdate(articleID, { $pull: { comments: id } }, { multi: true });
        }).then(dbArticle => {
            return res.status(200).send("Comment successfully deleted");
        });
    });

};
