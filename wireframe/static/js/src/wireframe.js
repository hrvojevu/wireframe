/* Javascript for WireframeXBlock. */
function WireframeXBlock(runtime, element, configuration) {

    function init(){
        renderElements();
        initDraggable();
        initDroppable();
    };

    
    var grid_url = $('.wireframe_canvas').css('background-image');

    /* TOGGLE GRID BACKGROUND ON BUTTON CLICK */
    $('.show_grid').toggle(function () {
        $('.wireframe_canvas').css('background', 'none');      
    }, function () {
        $('.wireframe_canvas').css('background', 'url("http://s32.postimg.org/9i33re0vp/grid4.png")');
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

    $("#reset_problem").click(function(){
        $.ajax({
            type: 'POST',
            url: runtime.handlerUrl(element, 'reset'),
            data: '{}',
            success: function(data){
                console.log("Successful reset");
                $(".wireframe_canvas").empty();
            }
        });
    });

    function renderElements() {
        console.log("renderElements");
        var i;
        var $item;
        var count = Object.keys(configuration.items_placed).length
        for(i=0;i<count;i++){
            /* Create item, append to canvas, change position */         
            $item = $("<"+ configuration.items_placed[i+1]['type'] + ">", {
                id: configuration.items_placed[i+1]['id'], 
                class: configuration.items_placed[i+1]['classes'],
                'data-cloned': configuration.items_placed[i+1]['cloned'],
            })
            $(".wireframe_canvas").append($item);
            $item.css({
                'position': 'absolute',
                'top': configuration.items_placed[i+1]['top'],
                'left': configuration.items_placed[i+1]['left']
            });
            
        }
    };

    function initDroppable() {
        $( ".wireframe_canvas" ).droppable({
            tolerance: "fit",
            drop: function( event, ui ) {
                console.log("initDroppable");
                /* 
                    Check if dragged element was already dropped/cloned. 
                    If it was cloned, don't apply function.
                */
                var $item = $(ui.draggable);
                var item_id;
                if(!$(ui.draggable).attr('data-cloned')){
                    /* Clone dropped element with no events */
                    $item = $item.clone();

                    /* Set data-cloned to true */
                    $item.attr('data-cloned', true);

                    /* Set element id */ 
                    item_id = getItemId()
                    $item.attr('id', item_id);

                    /* Append element to canvas. */
                    $item.appendTo(".wireframe_canvas");
                }
                console.log("ID: " + $item.attr('id'));
                item_id = $item.attr('id');
                /* Set position values. */
                $item.css({
                    'position': 'absolute',
                    'top': ui['position']['top'],
                    'left': ui['position']['left']
                });
                
                /* Reset draggable event. */
                $item.draggable({ disabled: true });
                $item.draggable("enable");
                $item.draggable({ 
                    containment: $('.wireframe_canvas'),
                    snap: '.wireframe_canvas',
                    snapTolerance: 10,
                    grid: [ 10, 10 ],
                });

                var $type = $item.prop('nodeName');
                var $classes = $item.attr("class");
                var data = {
                    id: item_id,
                    type: $type,
                    classes: $classes,
                    cloned: true,
                    top: ui['position']['top'],
                    left: ui['position']['left'],

                };
                submitLocation(data);
            }
        });
    };

    function initDraggable() {
        console.log("initDraggable");
        /*
        $('.draggable-item').draggable({ 
            containment: $('.wireframe_canvas'),
            snap: '.wireframe_canvas',
            snapTolerance: 10,
            grid: [ 10, 10 ],
            helper: 'clone',
            appendTo: $('.wireframe_canvas')
        });
        */
        $('.wireframe_block').find('.draggable-item').each(function() {
            $(this).draggable({
                containment: $('.wireframe_canvas'),
                snap: '.wireframe_canvas',
                snapTolerance: 10,
                grid: [ 10, 10 ],
                appendTo: $('.wireframe_canvas')
            });
            if (!$(this).attr('data-cloned')) {
                $(this).draggable({
                    helper: 'clone',
                });
            }
        });
    };

    function submitLocation(data) {
        console.log("Submit Location");
        console.log(data);
        
        $.ajax({
            type: 'POST',
            url: runtime.handlerUrl(element, 'submit_location'),
            data: JSON.stringify(data),
            success: function(data){
                console.log("Success");
            }
        });
    };

    function getItemId(){
        var id = $(".wireframe_canvas").children().length;
        console.log("ID_ " + id);        
        return id;
    };

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

    init();
}