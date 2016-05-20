/* Javascript for WireframeXBlock. */
function WireframeXBlock(runtime, element) {

    function updateCount(result) {
        $('.count', element).text(result.count);
    }

    var handlerUrl = runtime.handlerUrl(element, 'increment_count');

    $('p', element).click(function(eventObject) {
        $.ajax({
            type: "POST",
            url: handlerUrl,
            data: JSON.stringify({"hello": "world"}),
            success: updateCount
        });
    });

    $('.wireframe_library_icon').click(function(){
        console.log("click");
        if($('wireframe_library_items').hasClass('library_expanded')){
            console.log("no if");
            $('.wireframe_library_items').removeClass('library_expanded');
        }

        var icon = $(this).find('.fa-chevron-right');
        icon.removeClass('fa-chevron-right');
        icon.addClass('fa-chevron-left');

        $(this).addClass('icon-expanded');

        $('.wireframe_library_items').addClass('library_expanded');

    });

    $(function ($) {
        /* Here's where you'd do things on page load. */
    });
}