
$(function() {

    var quizId = /[?&]q=([^&]+)/.exec(location.href)[1];

    $.ajax({
        url: '/api/quiz.json?q=' + quizId
    }).then(function(data) {
        console.log(data);
    });

});
