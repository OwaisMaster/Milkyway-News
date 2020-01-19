var db = require("../models");

// Scraping tools
var axios = require("axios");
var cheerio = require("cheerio");

module.exports = app => {
    var results = [];

    console.log("Test");

    app.get("/", (req, res) => {
        console.log("Retrieving articles...");
        //Axios scrapes the Reuters World News website
        axios.get("https://www.reuters.com/news/world").then(response => {

            var $ = cheerio.load(response.data);

            var result = {};


            // Now, we grab the headline, byline, tag, article link, and summary from every Feedcard element
            $(".FeedItem_item").each((i, element) => {
                console.log(results.length);
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

                console.log("Posted: " + date);

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
                console.log("Data for Article " + results.length);
                console.log("Headline: " + headline);
                console.log("Tag: " + tag);
                console.log("Article Link: " + articleLink);
                console.log("Summary: " + summary);
                console.log("Image Source: " + imageSrc);
                //If all these have values, then the article information is added to the database (upserted if it is not already present)
                if (headline && articleLink && summary) {
                    console.log(1);
                    db.Article.updateOne({ headline: headline, articleLink: articleLink }, result, { upsert: true })
                        .then(dbArticles => {
                            // View the added articles in the console                            
                            console.log(dbArticles);
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
            res.render("index", { articles: results.reverse(), tagList: objTags, updateList: objUpdatedTimes, display1: "block", display2: "none" });

        })
            .catch(err => {
                // If an error occurs, send it back to the client
                res.json(err);
            });
    });
};
