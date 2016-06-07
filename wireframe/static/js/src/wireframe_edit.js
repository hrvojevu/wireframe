function WireframeEditBlock(runtime, element, params) {

    /*Function for submiting input elements in edit mode*/
    $(element).on('click', '.save-button', function() {
        var handlerUrl = runtime.handlerUrl(element, 'studio_submit');
        var el = $(element);
        var bool_duplicate = el.find('input[id=duplicate-elements]').is(":checked") ? "true" : "false";
        var data = {
            name: el.find('input[id=display-name]').val(),
            duplicate: bool_duplicate,
            width: el.find('input[id=width]').val(),
            height: el.find('input[id=height]').val(),
        };

        $.post(handlerUrl, JSON.stringify(data)).done(function(response) {
            window.location.reload(false);
        });

    });

    /* Function for canceling  */
    $(element).on('click', '.cancel-button', function() {
        runtime.notify('cancel', {});
    });

}
