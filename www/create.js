$(function() {

    $('#create-quiz').on('submit', function(e) {
        e.preventDefault();

        var data = {};

        $(this).find('[data-json-name]').each(function() {
            var name = $(this).data('json-name');

            data[name] = window[$(this).data('json-type') || 'String']($(this).val())
        });

        $.ajax({
            type: 'POST',
            url: '/api/create.json',
            data: JSON.stringify(data),
            contentType: 'application/json; charset=UTF-8',
            dataType: 'json'
        }).then(function(data) {
            location.href = '/' + data['quiz_id']
        });
    })

});
