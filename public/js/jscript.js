
$(".toComment").on("click", evt => {

    $(".articleCommentingOn").empty();
    $(".submitComment").prop("disabled", true);
    $("#name").val("");
    $("#comment").val("");

    var dataId = $(evt.currentTarget).attr("data-id");
    $(".submitComment").attr("data-id", dataId);

    $.getJSON("/article/" + dataId, data => {
        $(".articleCommentingOn").text(data.headline);
    });
});

$("#comment").on("input", () => {
    $(".submitComment").prop("disabled", false);
});

$(".submitComment").on("click", evt => {
    evt.preventDefault();
    //Store submit button data-id atribute in the dataId variable
    var dataId = $(evt.currentTarget).attr("data-id");

    //Name and comment assigned values from the user input
    var name = $("#name").val();
    var comment = $("#comment").val();

    //Name, comment, and articleID are stored in an object for the ajax call
    var postObj = { name: name, comment: comment, articleID: dataId };

    //AJAX Post call for adding the comment to the database
    $.ajax({
        method: "POST",
        url: "/submitComment/articles/" + dataId,
        dataType: "json",
        data: postObj

    }).then(data => {
        console.log(data);
    });

    location.reload();

});

$(".deleteComment").on("click", evt => {
    evt.preventDefault();
    //The data-attributes are stored in variables
    let commentID = $(evt.currentTarget).attr("data-commentid");
    let articleID = $(evt.currentTarget).attr("data-articleid");

    //AJAX Post call for deleting the comment from the database and from the comments array of its related Article)
    $.ajax({
        method: "POST",
        url: "/deleteComment/" + articleID + "/comments/" + commentID,
    }).then(data => {
        console.log(data);
    });
    location.reload();
});