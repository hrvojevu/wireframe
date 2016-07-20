/* Javascript for WireframeXBlock. */
function WireframeXBlock(runtime, element, configuration) {
    
    var $remove_button = $("<i>", {
        class: 'fa fa-times-circle remove-item',
        style: 'font-size: 14px; position: absolute; top: -7px; left: -20px; color: #a94442;',
        'aria-hidden': true,
    });

    function init(){
        renderElements();
        initDraggable();
        initDroppable();
        initAccordion();
        initDropMenu();
        initDropMenuSlider();
        setClickEvents();
    };
    
    var grid_url = $('.wireframe-canvas').css('background-image');

    /* Toggle grid background on button click */
    $('.show-grid').toggle(function () {
        $('.wireframe-canvas').css({
            'background': 'none',
        });      
    }, function () {
        $('.wireframe-canvas').css({
            'background': 'url("/xblock/resource/wireframe/public/images/grid.png")',                     
        });
    });       

    function renderElements() {
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
                    'z-index': configuration.items_placed[key]['z-index'],
                    'color': configuration.items_placed[key]['color'],
                    'background-color': configuration.items_placed[key]['background-color'],
                    'border-color': configuration.items_placed[key]['border-color']
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
            hides button-container and z-index setter. */
            function _reset(){
                $(".wireframe-canvas .draggable-item").removeClass("focus");
                $(".remove-item").remove();
                $(".customization-tools").hide();
            };

            /* Function that adds class "focus" to received object, 
            displays button container and z-index setter. */
            function _show($obj){
                $obj.addClass("focus");
                $obj.append($remove_button);
                $(".customization-tools").css({"display": "inline-flex"});
            };

            /* Reset if wireframe canvas is clicked */
            if($(event.target).hasClass("wireframe-canvas")){
                _reset();
            }

            /* If clicked element has class "remove-item", find item ID. Pass the ID to removeItem function */
            else if($(event.target).hasClass("remove-item")){
                var $parent_item = $(event.target).parent();
                var id = $parent_item.attr('id')
                removeItem(id);
                _reset();
            }

            /* If clicked element has class "draggable-item" call function _reset() and _show() */
            else if($(event.target).hasClass("draggable-item")){
                _reset()
                _show($(event.target));
            }
            /* Check if clicked element has parent with class "draggable-item", 
            if True call function _reset() and _show()
            */
            else if($(event.target).parents(".draggable-item").length){
                _reset()
                _show($(event.target).parents(".draggable-item"));
            }
        });

        /* Set click event for z-index change. */
        $('.set-z-index .fa').click(function(){
            //var $value = parseInt($("#index-value").val())
            var $value = $(".focus").css("z-index");
            if($(this).hasClass('index-down')){
                $value--;
            }
            else if($(this).hasClass('index-top')){
                $value = 999;
            }
            //$("#index-value").val($value);
            submitZIndex($value);
        });

        /* Change font awesome icon on accordion click */
        $(".accordion-header").click(function(){
            $(".accordion-header").find('i').removeClass("fa-angle-down").addClass("fa-angle-right");
            if($(this).hasClass("ui-state-active")){
                $(this).find('i').removeClass("fa-angle-right").addClass("fa-angle-down");
            } 
            else{
                $(this).find('i').removeClass("fa-angle-down").addClass("fa-angle-right");
            }
        });

        /*  */
        $(".customization-tools .dropit-submenu button").click(function(){
            /* Reset border on all elements, add border color to clicked element. */
            function _setBorder(cls, el){
                $(".customization-tools .dropit-submenu ." + cls).css("border-color", "#d2c9c9");
                $(el).css("border-color", "#3E51B5");
            };

            var item_id = $(".wireframe-canvas .draggable-item.focus").attr("id");

            if($(this).hasClass("text-color")){
               _setBorder("text-color", this);
            }
            else if($(this).hasClass("background-color")){
                _setBorder("background-color", this);
            }
            else if($(this).hasClass("border-color")){
                _setBorder("border-color", this);
            }
        });

        $(".dropit-submenu button").click(function(){
            var $item = $(".draggable-item.focus");

            function _setColor(attr, el){
                $item.css(attr, el.data('color'));
            };

            if($(this).hasClass("text-color")){
                _setColor("color", $(this))
            }
            else if($(this).hasClass("background-color")){
                _setColor("background-color", $(this))
            }
            else if($(this).hasClass("border-color")){
                _setColor("border-color", $(this))
            }
        });

        $("#apply-color-change").click(function(){
            var $item = $(".draggable-item.focus");

            var data = {
                id: $item.attr('id'),
                color: $item.css("color"),
                backgroundColor: $item.css("background-color"),
                borderColor: $item.css("border-color")
            };
            submitColorChanges(data);
        });
    };

    function initDroppable() {
        $( ".wireframe-canvas" ).droppable({
            tolerance: "fit",
            drop: function( event, ui ) {
                /* 
                    Check if dragged element was already dropped/cloned. 
                    If it was cloned, don't generate new id and z-index.
                */
                var $item = $(ui.draggable);
                var item_id;
                var z_index;
                if(!$(ui.draggable).attr('data-cloned')){
                    /* Clone dropped element with no events */
                    $item = $item.clone();

                    /* Set data-cloned to true */
                    $item.attr('data-cloned', true);

                    /* Set element id */ 
                    item_id = generateId()
                    $item.attr('id', item_id);

                    /* Set z-index */
                    z_index = $item.css('z-index', 999);

                    /* Append element to canvas. */
                    $item.appendTo(".wireframe-canvas");
                }
                item_id = $item.attr('id');
                z_index = $item.css('z-index');

                /* Set position values. */
                $item.css({
                    'position': 'absolute',
                    'top': ui['position']['top'],
                    'left': ui['position']['left'],
                    'z-index': z_index
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
                    zindex: z_index,
                    content: $content
                };
                submitLocation(data);
            }
        });
    };

    function initDraggable() {
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

                    /* Add background and padding to item that is dragged 
                    ui.helper.css({
                        'background': '#fff',
                        'padding': '5px'
                    });
                    */
                }                
            });
            if (!$(this).attr('data-cloned')) {
                $(this).draggable({
                    helper: 'clone',
                });
            }
        });
    };

    function initAccordion(){
        var acc = document.getElementsByClassName("accordion");
        var i;
        for (i = 0; i < acc.length; i++) {
            acc[i].onclick = function(){
                $(".accordion").removeClass("active");
                $(".panel").removeClass("show");
                $(".accordion i").removeClass("fa-angle-down").addClass("fa-angle-right");
                this.classList.toggle("active");
                this.nextElementSibling.classList.toggle("show");
                
                $(this).find('i').removeClass("fa-angle-right").addClass("fa-angle-down");
            }
        }
    };

    function initDropMenu(){
        $('.drop-menu').dropit({
            action: 'click',
            triggerEl: '.trigger-element',
            triggerParentEl: 'li.trigger-parent',
            submenuEl: ".submenu-element"
        });
    };

    function initDropMenuSlider(){
        $( "#slider" ).slider({
            value:12,
            min: 1,
            max: 20,
            step: 1,
            slide: function( event, ui ) {
                $( "#amount" ).val( ui.value );
            }
        });
        $( "#amount" ).val( $( "#slider" ).slider( "value" ) );
    };

    function submitLocation(data) {
        $.ajax({
            type: 'POST',
            url: runtime.handlerUrl(element, 'submit_location'),
            data: JSON.stringify(data),
            success: function(data){
                console.log("Success");
            }
        });
    };

    function submitColorChanges(data) {
        $.ajax({
            type: 'POST',
            url: runtime.handlerUrl(element, 'submit_color_changes'),
            data: JSON.stringify(data),
            success: function(data){
                /* Close drop menu after successful call */
                $('.dropit-open').removeClass('dropit-open').find('.dropit-submenu').hide();
            }
        });
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
    
    init(); 
}