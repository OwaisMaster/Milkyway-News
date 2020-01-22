var db = require("../models");

// Scraping tools
var axios = require("axios");
var cheerio = require("cheerio");

module.exports = app => {
    var results = [];

    console.log("Test");

    app.get("/" || "*", (req, res) => {
        console.log("Retrieving articles...");
        //Axios scrapes the Reuters World News website
        axios.get("https://www.reuters.com/news/world").then(response => {

            var $ = cheerio.load(response.data);

            var result = {};


            // Now, we grab the headline, byline, tag, article link, and summary from every Feedcard element
            $(".FeedItem_item").each((i, element) => {
                //console.log(results.length);
                //The loop stops after ten results
                if (results.length > 9) {
                    return false;
                }

                var headline = $(element).find("h2").text().trim();
                var date = $(element).find(".FeedItemMeta_date-updated").text().trim();
                var tag = $(element).find(".FeedItemMeta_channel").text().trim();
                var articleLink = $(element).find("h2>a").attr("href");
                var imageSrc = $(element).find("img").attr("src");
                var summary = $(element).find("p.FeedItemLede_lede").text().trim();

                // Add the headline, byline, tag, article link, and summary, and save them as properties of the result object
                result = {
                    headline: headline,
                    updated: date,
                    tag: tag,
                    articleLink: articleLink,
                    imageSrc: imageSrc,
                    summary: summary
                };
                //Push each result to the results array
                results.push(result);

                if (tag == null) {
                    tag = "None";
                }

                if (articleLink === undefined) {
                    articleLink = "https://google.com/" + results.length;
                }

                //If all these have values, then the article information is added to the database (upserted if it is not already present)
                if (headline && articleLink && summary) {
                    //console.log(1);
                    db.Article.updateOne({ headline: headline, articleLink: articleLink }, result, { upsert: true })
                        .then(dbArticles => {
                            // View the added articles in the console                            
                            //console.log(dbArticles);
                        })
                        .catch(err => {
                            // If an error occurred, log it
                            console.log(err);
                        })
                }
            });
        });

        db.Article.find({}).populate("comments").then(data => {
            //Loop through the results and add an iterator property to each object
            for (var i = 0; i < data.length; i++) {
                data[i].iterator = i;
            }

            //Creates a tags array of all the tags without any repeats
            const tags = [...new Set(data.map(a => a.tag))];
            //const comments = [...new Set(data.map(a => a.comments))];
            //console.log(comments);
            //Alphabetizes the array
            tags.sort();
            const objTags = [];
            //Puts each tag from the tags array into an object in the objTags array
            tags.forEach(tag => objTags.push({ tagName: tag }));

            //Creates a bylines array of all the bylines without any repeats
            const updatedTimes = [...new Set(data.map(a => a.postUpdate))];
            //Alphabetizes the array
            updatedTimes.sort();
            const objUpdatedTimes = [];
            //Puts each byline from the bylines array into an object in the objBylines array
            updatedTimes.forEach(postUpdate => objUpdatedTimes.push({ updatedPost: postUpdate }));

            //Renders index.handlebars, reversing the data order so that the most recently added articles are displayed first
            //The objTags and the objBylines arrays are for the tag and byline columns, and display1 and display2 are for hiding the appropriate column (bylines in this case)
            res.render("index", { articles: results.reverse(), tagList: objTags, updateList: objUpdatedTimes, display1: "block" });

        })
            .catch(err => {
                // If an error occurs, send it back to the client
                res.json(err);
            });
    });

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

    app.get("/tags/:tagName", (req, res) => {
        let tagName = req.params.tagName;
        var tagged = [];
        var commentList = [];
        //Find all articles with the specified tag name
        db.Article.find({ tag: tagName }).lean().populate("comments").then(data => {
            //Add an iterator property to each article object
            for (var i = 0; i < data.length; i++) {
                data[i].iterator = i;
            }

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

            //console.log(tagged[0].comments[0]);

            //Also find all articles so that all of the tags can still be displayed in the left column
            db.Article.find({}).lean().populate("comments").then(allData => {
                const tags = [...new Set(allData.map(a => a.tag))];
                //tagged.map(a => commentList.push(a.comments[0]));
                //console.log(commentList);
                tags.sort();
                const objTags = [];
                tags.forEach(tag => objTags.push({ tagName: tag }));

                res.render("index", { articles: tagged.reverse(), tagList: objTags, comments: commentList, display1: "block", display2: "none" });
            })

        })
            .catch(err => {
                // If an error occurs, send it back to the client
                res.json(err);
            });
    });

    app.get("/article/:id", (req, res) => {
        var _id = req.params.id;
        //var articleData = {};
        console.log(_id);

        db.Article.findById({ _id }).populate("comments").then(article => {
            //console.log(article);

            res.json(article);


        })
    })

    app.post("/submitComment/articles/:id", (req, res) => {
        var id = req.params.id;
        console.log(id);
        console.log(req.body);

        //If there is a blank name value, then it is set to Anonymous
        if (req.body.name == "") {
            req.body.name = "Anonymous";
        };

        // Create a new Comment in the database
        db.Comment.create(req.body)
            .then(dbComment => {
                console.log("dbComment._id: " + dbComment._id);

                // If a Comment was created successfully, find its article (based on the id) and push the new Comment's _id to the Article's comments array
                // { new: true } tells the query that we want it to return the updated Article -- it returns the original by default
                // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
                return db.Article.findByIdAndUpdate(id, { $push: { comments: dbComment._id } }, { new: true });
            })
            .then(dbArticle => {
                // If the Article was updated successfully, send it back to the client
                console.log("dbArticle: ");
                console.log(dbArticle);
                res.send(dbArticle);
            })
            .catch(err => {
                // If an error occurs, send it back to the client
                res.send(err);
            });
    });

    app.post("/deleteComment/:articleID/comments/:id", (req, res) => {
        var id = req.params.id;
        var articleID = req.params.articleID;
        console.log("articleID: " + articleID);
        console.log("id: " + id);
        console.log(req.body);

        //Find the specific comment by its id and remove it
        db.Comment.findByIdAndRemove(id, (err, data) => {
            // As always, handle any potential errors:
            if (err) return res.status(500).send(err);
            console.log("data._id: " + data._id);
        }).then(data2 => {
            //Find the specific article by its id and update its comments array, pulling out the deleted comment's id
            return db.Article.findByIdAndUpdate(articleID, { $pull: { comments: id } }, { multi: true });
        }).then(dbArticle => {
            //Let the client know of the successful deletion
            return res.status(200).send("Comment successfully deleted");
        });
    });

};
