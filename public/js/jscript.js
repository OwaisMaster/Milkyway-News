
//When the "Post a Comment" button is clicked and the modal appears
$(".toComment").on("click", evt => {
    //The modal is emptied of any article titles
    $(".articleGettingComment").empty();
    //The submit button is disabled, and the fields are emptied
    $(".commentSubmit").prop("disabled", true);
    $("#name").val("");
    $("#comment").val("");

    //The data-id of the "Post a Comment" button (for the specific article) is transferred to the submit button
    var thisId = $(evt.currentTarget).attr("data-id");
    console.log(thisId);
    $(".commentSubmit").attr("data-id", thisId);

    //Get call to display the name of the article being commented on
    $.getJSON("/article/" + thisId, data => {
        console.log(data.headline);
        $(".articleGettingComment").text(data.headline);
    });
});

//When a comment is entered in the comment field, the submit button is enabled
$("#comment").on("input", () => {
    $(".commentSubmit").prop("disabled", false);
});

//When the submit button is clicked
$(".commentSubmit").on("click", evt => {
    evt.preventDefault();
    //The submit button's data-id attribute is stored in the thisId variable
    var thisId = $(evt.currentTarget).attr("data-id");
    // name is assigned the value taken from the name input
    var name = $("#name").val();
    // comment is assigned the value taken from the comment textarea
    var comment = $("#comment").val();
    // The name, comment, and articleID art stored in an object for the ajax call
    var postObj = { name: name, comment: comment, articleID: thisId };
    console.log("postObj: ");
    console.log(postObj);

    //AJAX Post call for adding the comment to the database
    $.ajax({
        method: "POST",
        url: "/submitComment/articles/" + thisId,
        dataType: "json",
        data: postObj

    })
        // With that done
        .then(data => {
            // Log the response
            console.log(data);
        });
    //Reload the page to reflect new comment
    location.reload();

});

//When the deleteComment button is clicked
$(".deleteComment").on("click", evt => {
    evt.preventDefault();
    //The data-attributes are stored in variables
    let commentID = $(evt.currentTarget).attr("data-commentid");
    let articleID = $(evt.currentTarget).attr("data-articleid");
    console.log("Comment ID: " + commentID);

    //AJAX Post call for deleting the comment from the database (including from the comments array of its related Article)
    $.ajax({
        method: "POST",
        url: "/deleteComment/" + articleID + "/comments/" + commentID,
    }).then(data => {
        //Then log the response
        console.log(data);
    });
    //And reload the page to reflect the change
    location.reload();
});