/* Javascript for WireframeXBlock. */
function WireframeXBlock(runtime, element, configuration) {

    function init(){
        renderElements();
        initColorpicker()
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

    function initColorpicker(){
        $("#showAlpha").spectrum({
            preferredFormat: "rgb",
            showAlpha: true,
            color: "#fff",
            showInitial: true,
            showInput: true,
            showPalette: true,
            palette: [
                ["#000","#444","#666","#999","#ccc","#eee","#f3f3f3","#fff"],
                ["#f00","#f90","#ff0","#0f0","#0ff","#00f","#90f","#f0f"],
                ["#f4cccc","#fce5cd","#fff2cc","#d9ead3","#d0e0e3","#cfe2f3","#d9d2e9","#ead1dc"],
                ["#ea9999","#f9cb9c","#ffe599","#b6d7a8","#a2c4c9","#9fc5e8","#b4a7d6","#d5a6bd"],
                ["#e06666","#f6b26b","#ffd966","#93c47d","#76a5af","#6fa8dc","#8e7cc3","#c27ba0"],
                ["#c00","#e69138","#f1c232","#6aa84f","#45818e","#3d85c6","#674ea7","#a64d79"],
                ["#900","#b45f06","#bf9000","#38761d","#134f5c","#0b5394","#351c75","#741b47"],
                ["#600","#783f04","#7f6000","#274e13","#0c343d","#073763","#20124d","#4c1130"]
            ],
            /*
            move: function(color) {
                var bg_color = color.toRgb();
                var rgba = "rgba("+bg_color['r']+","+bg_color['g']+","+bg_color['b']+","+bg_color['a']+")";
                $(".wireframe_canvas .draggable-item.focus").css({"background": rgba});
            },
            */
            change: function(color) {
                var item_id = $(".wireframe_canvas .draggable-item.focus").attr("id");
                if(item_id){
                    var bg_color = color.toRgb();
                    var rgba = "rgba("+bg_color['r']+","+bg_color['g']+","+bg_color['b']+","+bg_color['a']+")";
                    console.log(item_id);
                    $(".wireframe_canvas .draggable-item.focus").css({"background": rgba});
                    var data = {
                        id: item_id,
                        color: rgba
                    };
                    submitBackgroundColor(data);
                }
            }
        });    
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

    function submitBackgroundColor(data) {
        console.log("Submit background color");
        console.log(data);
        /*
        $.ajax({
            type: 'POST',
            url: runtime.handlerUrl(element, 'submit_background_color'),
            data: JSON.stringify(data),
            success: function(data){
                console.log("Success");
            }
        });
        */
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
    
    init(); 

    /* 
    Set click event on body. Remove class focus from any draggable item when clicked.
    If clicked element is draggable item, add class focus.    
    */
    $("body").click(function(event) {
        $(".wireframe_canvas .draggable-item").removeClass("focus");
        $(".sp-replacer").hide();
        if($(event.target).hasClass("draggable-item")){
            $(event.target).addClass("focus");
            $(".sp-replacer").css({"display": "inline-block"});
        }
    });

    $(".wireframe_canvas .draggable-item").hover(
        function() {
            $(this).append($("<i class='fa fa-times-circle remove-item' style='font-size: 15px; color: #a94442; position: relative; float: right; top: -3px; right: -3px;' aria-hidden='true'></i>"));
        }, function() {
            $(this).find("i").remove();
        }
    );
}