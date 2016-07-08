/* Javascript for WireframeXBlock. */
function WireframeXBlock(runtime, element, configuration) {
    /*
    var $info_button = $("<i>", {
        class: 'fa fa-info-circle remove-item',
        //style: 'font-size: 15px; color: #fff; position: relative; float: right; top: -15%; right: -15%; display: none',
        'aria-hidden': true,
    });
    */
    /*
    var $remove_button = $("<i>", {
        class: 'fa fa-times-circle remove-item',
        //style: 'font-size: 15px; color: #a94442; position: relative; float: right; top: -15%; right: -15%; display: none',
        'aria-hidden': true,
    });
    */
    var $info_button = "<i class='fa fa-info-circle' aria-hidden='true' style='float: left; color: #3E51B5;'></i>";  
    var $remove_button = "<i class='fa fa-times-circle remove-item' aria-hidden='true' style='float: right; color: #3E51B5;'></i>";  
    var $buttons_container = 
    "<div class='buttons-container' style='font-size: 5px; width: 40px; height: 20px;" +
    "margin: 0 auto; position: relative; display: none'>" +
    $info_button + $remove_button + "</div>";

    function init(){
        renderElements();
        initColorpicker()
        initDraggable();
        initDroppable();
    };

    
    var grid_url = $('.wireframe-canvas').css('background-image');

    /* TOGGLE GRID BACKGROUND ON BUTTON CLICK */
    $('.show-grid').toggle(function () {
        $('.wireframe-canvas').css('background', 'none');      
    }, function () {
        //$('.wireframe-canvas').css('background', 'url("http://s32.postimg.org/9i33re0vp/grid4.png")');
        $('.wireframe-canvas').css('background', 'url("/xblock/resource/wireframe/public/images/grid4.png")');
    });       

    function renderElements() {
        console.log("renderElements");
        var $item;
        for (var key in configuration.items_placed) {
            if (configuration.items_placed.hasOwnProperty(key)) {
                /* Create item, append to canvas, change position */         
                $item = $("<"+ configuration.items_placed[key]['type'] + ">", {
                    id: configuration.items_placed[key]['id'], 
                    class: configuration.items_placed[key]['classes'],
                    'data-cloned': configuration.items_placed[key]['cloned'],
                })
                $(".wireframe-canvas").append($item);
                $item.css({
                    'position': 'absolute',
                    'top': configuration.items_placed[key]['top'],
                    'left': configuration.items_placed[key]['left']
                });
                /* Append content to item */
                $item.append(configuration.items_placed[key]['content']);
            }           
        }
        //$(".wireframe-canvas .draggable-item").append($buttons_container);
    };

    function initColorpicker(){
        $("#showAlpha").spectrum({
            preferredFormat: "hex",
            //showAlpha: true,
            color: "#444",
            //showInitial: true,
            //showInput: true,
            showPaletteOnly: true,
            showPalette: true,
            palette: [
                ["#000","#444","#666","#999"],
                ["#ccc","#eee","#f3f3f3","#fff"]
                /*
                ["#000","#444","#666","#999","#ccc","#eee","#f3f3f3","#fff"],
                ["#f00","#f90","#ff0","#0f0","#0ff","#00f","#90f","#f0f"],
                ["#f4cccc","#fce5cd","#fff2cc","#d9ead3","#d0e0e3","#cfe2f3","#d9d2e9","#ead1dc"],
                ["#ea9999","#f9cb9c","#ffe599","#b6d7a8","#a2c4c9","#9fc5e8","#b4a7d6","#d5a6bd"],
                ["#e06666","#f6b26b","#ffd966","#93c47d","#76a5af","#6fa8dc","#8e7cc3","#c27ba0"],
                ["#c00","#e69138","#f1c232","#6aa84f","#45818e","#3d85c6","#674ea7","#a64d79"],
                ["#900","#b45f06","#bf9000","#38761d","#134f5c","#0b5394","#351c75","#741b47"],
                ["#600","#783f04","#7f6000","#274e13","#0c343d","#073763","#20124d","#4c1130"]
                */
            ],
            /*
            move: function(color) {
                var bg_color = color.toRgb();
                var rgba = "rgba("+bg_color['r']+","+bg_color['g']+","+bg_color['b']+","+bg_color['a']+")";
                $(".wireframe-canvas .draggable-item.focus").css({"background": rgba});
            },
            */
            change: function(color) {
                var item_id = $(".wireframe-canvas .draggable-item.focus").attr("id");
                if(item_id){
                    var bg_color = color.toRgb();
                    var rgba = "rgba("+bg_color['r']+","+bg_color['g']+","+bg_color['b']+","+bg_color['a']+")";
                    console.log(item_id);
                    $(".wireframe-canvas .draggable-item.focus").css({"background": rgba});
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
        $( ".wireframe-canvas" ).droppable({
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
                    item_id = generateId()
                    $item.attr('id', item_id);

                    /* Append element to canvas. */
                    $item.appendTo(".wireframe-canvas");

                    /* Append remove button to item */
                    $item.append($buttons_container);
                    //$item.append($info_button);
                }
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
                    containment: $('.wireframe-canvas'),
                    snap: '.wireframe-canvas',
                    snapTolerance: 10,
                    grid: [ 10, 10 ],
                });

                /* Show items menu after item is dropped on canvas */
                $('.gn-menu-wrapper').animate({
                    opacity: 'show'
                }, 'fast');

                /* Set data and submit item location */
                var $type = $item.prop('nodeName');
                var $classes = $item.attr("class");
                var $content = $item.html();
                var data = {
                    id: item_id,
                    type: $type,
                    classes: $classes,
                    cloned: true,
                    top: ui['position']['top'],
                    left: ui['position']['left'],
                    content: $content
                };
                submitLocation(data);
            }
        });
    };

    function initDraggable() {
        console.log("initDraggable");
        /*
        $('.draggable-item').draggable({ 
            containment: $('.wireframe-canvas'),
            snap: '.wireframe-canvas',
            snapTolerance: 10,
            grid: [ 10, 10 ],
            helper: 'clone',
            appendTo: $('.wireframe-canvas')
        });
        */
        $('.wireframe-block').find('.draggable-item').each(function() {
            $(this).draggable({
                containment: $('.wireframe-canvas'),
                snap: '.wireframe-canvas',
                snapTolerance: 10,
                grid: [ 10, 10 ],
                appendTo: $('.wireframe-canvas'),
                start: function( event, ui ) {
                    $('.gn-menu-wrapper').hide();
                }                
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

    function removeItem(item_id){
        var data = {
            id: item_id,
        };
        $.ajax({
            type: 'POST',
            url: runtime.handlerUrl(element, 'remove_item'),
            data: JSON.stringify(data),
            success: function(data){
                $("#" + item_id).remove();
            }
        });
    };

    /* Generate ID for item by counting elements  */
    function generateId() {
      return Math.round(new Date().getTime() + (Math.random() * 100));
    };

    $(function ($) {
        /* Here's where you'd do things on page load. */
    });


    /* Menu accordion functionality */
    var acc = document.getElementsByClassName("accordion");
    var i;
    for (i = 0; i < acc.length; i++) {
        acc[i].onclick = function(){
            this.classList.toggle("active");
            this.nextElementSibling.classList.toggle("show");
        }
    }
    $(".accordion").click(function(){
        var $el = $(this).find(".fa");
        if($el.hasClass("fa-angle-right")){
            $el.removeClass("fa-angle-right").addClass("fa-angle-down");
        } 
        else{
            $el.removeClass("fa-angle-down").addClass("fa-angle-right");
        }
        /*var $panel = $(this).parent().find(".panel");   */  
    });  
    
    init(); 

    $(".problem-reset").click(function(){
        $.ajax({
            type: 'POST',
            url: runtime.handlerUrl(element, 'reset'),
            data: '{}',
            success: function(data){
                console.log("Successful reset");
                $(".wireframe-canvas").empty();
            }
        });
    });

    /* 
    Set click event on body. Remove class focus from any draggable item when clicked.
    If clicked element is draggable item, add class focus.    
    */
    $(document).click(function(event) {
        console.log("Body click");
        $(".wireframe-canvas .draggable-item").removeClass("focus");
        $(".buttons-container").hide();
        $(".sp-replacer").hide();
        if($(event.target).hasClass("draggable-item")){
            $(event.target).addClass("focus");
            $(event.target).find(".buttons-container").css({
                "display": "",
            });
            $(".sp-replacer").css({"display": "inline-block"});
        }
    });

    $(".remove-item").click(function(){
        var $parent_item = $(this).parent().parent();
        var id = $parent_item.attr('id')
        console.log(id);
        removeItem(id);
    });

/*
    $(".wireframe-canvas .draggable-item").hover(
        function() {
            $(this).find(".remove-item").css({
                "display": "",
            });
        }, function() {
             $(this).find(".remove-item").css({
                "display": "none",
            });
        }
    );
*/
}