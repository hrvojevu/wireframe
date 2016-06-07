/* Javascript for WireframeXBlock. */
function WireframeXBlock(runtime, element) {

    function updateCount(result) {
        $('.count', element).text(result.count);
    }

    var handlerUrl = runtime.handlerUrl(element, 'increment_count');

    $('p', element).click(function(eventObject) {
        $.ajax({
            type: 'POST',
            url: handlerUrl,
            data: JSON.stringify({'hello': 'world'}),
            success: updateCount
        });
    });

    //$( '#accordion' ).accordion({
    //  heightStyle: 'content'
    //});
    
    /* INITIALIZE DRAGGABLE ITEMS */
    $( '.draggable' ).draggable({ 
        snap: '.ui-widget-header',
        grid: [ 10, 10 ]
    });

    /* INITIALIZE CANVAS DROPPABLE ZONE */
    $( ".remove_button" ).droppable({
        hoverClass: "remove_button_hover",
        drop: function( event, ui ) {
            $(ui.draggable).remove();
        }
    });

    /* TOGGLE GRID BACKGROUND ON BUTTON CLICK */
    $('.show_grid').toggle(function () {
        $('.wireframe_canvas').css('background', 'none');      
    }, function () {
        $('.wireframe_canvas').css('background', 'url("/xblock/resource/wireframe/static/images/grid4.png")');
    });       

    /* EXPAND ICONS LIBRARY ON BUTTON CLICK */
    $('.wireframe_library_icon').click(function(){
        var items = $('#wireframe_library_items');
        var icon = $(this).find('.fa');

        if(items.hasClass('library_expanded')){
            items.removeClass('library_expanded');
            icon.removeClass('fa-chevron-left');
            icon.addClass('fa-chevron-right'); 
            $(this).removeClass('icon-expanded');
            $('#accordion').css('display','none');
        }
        else{
            items.addClass('library_expanded');
            icon.removeClass('fa-chevron-right'); 
            icon.addClass('fa-chevron-left');
            $(this).addClass('icon-expanded');
            $('#accordion').css('display','initial');
        }        

    });

    /* DUPLICAE ICONS ON CLICK */
    $('.draggable-item').dblclick(function(){
        var $el = $(this).clone();
        $el.draggable({ 
            snap: '.ui-widget-header',
            grid: [ 10, 10 ]
        });
        //$el.empty();
        $el.appendTo('.wireframe_canvas');
        $el.css({
            //'left': '50%',
            //'top': '50%'
        });
    });

    $(function ($) {
        /* Here's where you'd do things on page load. */
    });

    var acc = document.getElementsByClassName("accordion");
var i;

for (i = 0; i < acc.length; i++) {
    acc[i].onclick = function(){
        this.classList.toggle("active");
        this.nextElementSibling.classList.toggle("show");
    }
}
}