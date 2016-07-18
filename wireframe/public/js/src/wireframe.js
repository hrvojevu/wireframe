/* Javascript for WireframeXBlock. */
function WireframeXBlock(runtime, element, configuration) {
    
    var $remove_button = $("<i>", {
        class: 'fa fa-times-circle remove-item',
        style: 'font-size: 14px; position: absolute; top: -7px; left: -20px; color: #a94442;',
        'aria-hidden': true,
    });

    function init(){
        renderElements();
        setClickEvents();
        initColorpicker()
        initDraggable();
        initDroppable();
    };
    
    var grid_url = $('.wireframe-canvas').css('background-image');

    /* Toggle grid background on button click */
    $('.show-grid').toggle(function () {
        $('.wireframe-canvas').css({
            'background': 'none',
        });      
    }, function () {
        //$('.wireframe-canvas').css('background', 'url("http://s32.postimg.org/9i33re0vp/grid4.png")');
        $('.wireframe-canvas').css({
            'background': 'url("/xblock/resource/wireframe/public/images/grid.png")',                     
        });
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
                    'left': configuration.items_placed[key]['left'],
                    'z-index': configuration.items_placed[key]['z-index']
                });
                /* Append content to item */
                $item.append(configuration.items_placed[key]['content']);
            }           
        }
    };

    function setClickEvents() {
        /* 
            When "problem-reset" is clicked, make ajax request. 
            If successful, clear wireframe canvas. 
        */
        $(".problem-reset").click(function(){
            $.ajax({
                type: 'POST',
                url: runtime.handlerUrl(element, 'reset'),
                data: '{}',
                success: function(data){
                    $(".wireframe-canvas").empty();
                }
            });
        });

        /* Set click event on body. */
        $(document).click(function(event) {
            /* Function that removes class "focus" from draggable items in wireframe canvas,
            hides button-container, color picker and z-index setter. */
            function _reset(){
                $(".wireframe-canvas .draggable-item").removeClass("focus");
                $(".remove-item").remove();
                $(".sp-replacer").hide();
                $(".set-z-index").hide(); 
            };

            /* Function that adds class "focus" to received object, 
            displays button container,color picker and z-index setter. */
            function _show($obj){
                $obj.addClass("focus");
                $obj.append($remove_button);
                $(".sp-replacer").css({"display": "inline-block"});
                $(".set-z-index").css({"display": "inline-block"});
            };

            /* Reset if wireframe canvas is clicked */
            if($(event.target).hasClass("wireframe-canvas")){
                _reset();
            }

            /* If clicked element has class "remove-item", find item ID. Pass the ID to removeItem function */
            else if($(event.target).hasClass("remove-item")){
                console.log("remove-item");
                var $parent_item = $(event.target).parent();
                var id = $parent_item.attr('id')
                removeItem(id);
                _reset();
            }

            /* If clicked element has class "draggable-item" call function _reset() and _show() */
            else if($(event.target).hasClass("draggable-item")){
                _reset()
                _show($(event.target));
                //setZIndex($(event.target));
            }
            /* Check if clicked element has parent with class "draggable-item", 
            if True call function _reset() and _show()
            */
            else if($(event.target).parents(".draggable-item").length){
                _reset()
                _show($(event.target).parents(".draggable-item"));
                //setZIndex($(event.target).parents(".draggable-item"));
            }
        });

        /* Set click event for z-index change. */
        $('.set-z-index .fa').click(function(){
            //var $value = parseInt($("#index-value").val())
            var $value = $(".focus").css("z-index");
            console.log($value);
            if($(this).hasClass('index-down')){
                $value--;
            }
            else if($(this).hasClass('index-top')){
                $value = 999;
            }
            //$("#index-value").val($value);
            submitZIndex($value);
        });
    };

    function initColorpicker(){
        $("#showAlpha").spectrum({
            preferredFormat: "hex",
            //showAlpha: true,
            color: "#666",
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
                }
                item_id = $item.attr('id');

                /* Set position values. */
                $item.css({
                    'position': 'absolute',
                    'top': ui['position']['top'],
                    'left': ui['position']['left'],
                    'z-index': 999
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
                    zindex: 999,
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
                    /* Hide items menu when drag starts. */
                    $('.gn-menu-wrapper').hide();

                    console.log(ui.draggable);
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

    /* Set change event. If user manually changes value, submit z-index value.
    $("#index-value").change(function(){
        console.log("Changed");
        var $value = parseInt($("#index-value").val())
        submitZIndex($value);
    });
    */

    function submitZIndex($value){
        console.log("Submitting z-index...");
        var data = {
            id: $(".focus").attr("id"),
            value: $value
        };
        $.ajax({
            type: 'POST',
            url: runtime.handlerUrl(element, 'submit_z_index'),
            data: JSON.stringify(data),
            success: function(data){                
                $(".focus").zIndex($value);;
            }
        });
    };

    /* Set current z-index value of element with class "focus". 
    function setZIndex($obj){
        var $value = $obj.css("z-index");
        $("#index-value").val($value);
    };
    */


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
            $(".accordion").removeClass("active");
            $(".panel").removeClass("show");
            this.classList.toggle("active");
            this.nextElementSibling.classList.toggle("show");
            console.log(this.classList);            

            if($(this).hasClass("active")){
                $(this).find('i').removeClass("fa-angle-right").addClass("fa-angle-down");
            } 
            else{
                $(this).find('i').removeClass("fa-angle-down").addClass("fa-angle-right");
            }
        }
    }
    /*
    $(".accordion").click(function(){
        var $el = $(this).children(".fa");
        console.log($el);
        if($el.hasClass("fa-angle-right")){
            $el.removeClass("fa-angle-right").addClass("fa-angle-down");
        } 
        else{
            $el.removeClass("fa-angle-down").addClass("fa-angle-right");
        }
        //var $panel = $(this).parent().find(".panel"); 
    });  
*/
    
    init(); 
}