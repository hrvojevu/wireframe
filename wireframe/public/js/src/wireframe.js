/* Javascript for WireframeXBlock. */
function WireframeXBlock(runtime, element, configuration) {
    
    var $remove_button = $("<i>", {
        class: 'fa fa-times-circle remove-item',
        style: 'font-size: 14px; position: absolute; top: -7px; left: -15px; color: #a94442;',
        'aria-hidden': true,
    });

    var $edit_button = $("<i>", {
        class: 'fa fa-pencil edit-item',
        style: 'font-size: 14px; position: absolute; top: 14px; left: -15px; color: #3E51B5;',
        'aria-hidden': true,
    });

    var $edit_button_confirm = $("<i>", {
        class: 'fa fa-check edit-item-confirm',
        style: 'font-size: 14px; position: absolute; top: 14px; left: -15px; color: #3E51B5;',
        'aria-hidden': true,
    });

    var editing_in_progress = false;
    var editing_text = {};
    var editor = new MediumEditor();
    var grid_url = $('.wireframe-canvas').css('background-image');

    /* Toggle grid background on button click */
    $('.show-grid').toggle(function () {
        $('.wireframe-canvas').css({
            'background-image': 'none',
        });      
    }, function () {
        $('.wireframe-canvas').css({
            'background-image': 'url("/xblock/resource/wireframe/public/images/grid.png")',                     
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
                /* Append item to canvas and set css values */
                $(".wireframe-canvas").append($item);
                $item.css({
                    'position': 'absolute',
                    'top': configuration.items_placed[key]['top'],
                    'left': configuration.items_placed[key]['left'],
                    'width': configuration.items_placed[key]['width'],
                    'height': configuration.items_placed[key]['height'],
                    'z-index': configuration.items_placed[key]['z-index'],
                    'color': configuration.items_placed[key]['color'],
                    'background-color': configuration.items_placed[key]['background-color'],
                    'border-color': configuration.items_placed[key]['border-color'],
                    'font-size': configuration.items_placed[key]['font-size'],
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
                $(".edit-item").remove();                
                $(".edit-item-confirm").remove();                
                $(".customization-tools").hide();
            };

            function _destroyEditor(){
                editor.destroy();
            };

            /* Function that adds class "focus" to received object, 
            displays button container and z-index setter. */
            function _show($obj){
                $obj.addClass("focus");
                $obj.append($remove_button);
                $(".customization-tools").css({"display": "inline-flex"});

                if($obj.hasClass("draggable-p") 
                    || $obj.hasClass("draggable-single-line") 
                    || $obj.hasClass("draggable-link") 
                    || $obj.hasClass("draggable-btn")
                    || $obj.hasClass("draggable-textarea")){
                    $obj.append($edit_button);
                }
            };

            function _checkIfEditingInProcess($obj){
                /* If editing is in process */
                if(editing_in_progress){
                    /* Don't apply if clicked item is the one being edited */
                    if(!($obj.attr("id") == editing_text['id'])){

                        /* Get item that is edited */
                        var $item = $("#" + editing_text['id']);

                        /* Revert text to original state if save button was not clicked */
                        $item.text(editing_text['content']);

                        /* Set editing_in_progress to false and clear editing_text */
                        editing_in_progress = false;
                        editing_text = {};

                        /* Reinitialize draggable */
                        $item.draggable("enable");
                        $item.draggable({ 
                            containment: $('.wireframe-canvas'),
                            snap: '.wireframe-canvas',
                            snapTolerance: 10,
                            //grid: [ 10, 10 ],
                        });

                        _destroyEditor();
                    }
                    /* If clicked element is the one being edited, swap icons */
                    else if($obj.attr("id") == editing_text['id']){
                        $(".edit-item").remove();
                        $obj.append($edit_button_confirm);
                    }                    
                }
            };

            /* If clicked element has class "remove-item", find item ID. Pass the ID to removeItem function */
            if($(event.target).hasClass("remove-item")){
                var $parent_item = $(event.target).parent();
                var id = $parent_item.attr('id');
                removeItem(id);
                _reset();                
            }

            else if($(event.target).hasClass("edit-item")){
                /* Find item and its id */
                var $item = $(event.target).parent();
                var id = $item.attr('id');

                /* Swap buttons */
                $(".edit-item").remove();
                $item.append($edit_button_confirm);

                /* Reset editing_in_progress flag and clear dict */
                editing_in_progress = true;
                editing_text = {
                    id: id,
                    content: $item.text()
                };

                /* Disable draggable */
                $item.draggable({ disabled: true }); 

                /* Init editor */
                editor = new MediumEditor($item);
            }

            else if($(event.target).hasClass("edit-item-confirm")){
                /* Find correct item */
                var $item = $(event.target).parent();

                /* Set up data and submit */
                var data = {
                    id: $item.attr("id"),
                    content: $item.text()
                };
                submitChange(data, runtime.handlerUrl(element, 'submit_text_edit'));

                /* Set editing_in_progress to false and clear editing_text */
                editing_in_progress = false;
                editing_text = {};

                /* Reinitialize draggable */
                $item.draggable("enable");
                $item.draggable({ 
                    containment: $('.wireframe-canvas'),
                    snap: '.wireframe-canvas',
                    snapTolerance: 10,
                    //grid: [ 10, 10 ],
                });  

                $(".edit-item-confirm").remove();
                _destroyEditor();
                _reset();              
            }

            /* Reset if wireframe canvas is clicked */
            else if($(event.target).hasClass("wireframe-canvas")){   
                _checkIfEditingInProcess($(event.target));             
                _reset();
            }

            /* If clicked element has class "draggable-item" call function _reset() and _show() */
            else if($(event.target).hasClass("draggable-item")){                
                _reset();
                _show($(event.target));
                _checkIfEditingInProcess($(event.target));
            }
            /* Check if clicked element has parent with class "draggable-item", 
            if True call function _reset() and _show()
            */
            else if($(event.target).parents(".draggable-item").length){
                _checkIfEditingInProcess($(event.target));
                _reset();                
                _show($(event.target).parents(".draggable-item"));
            }
        });

        /* Set click event for z-index change. */
        $('.set-z-index .fa').click(function(){
            var $item = $(".draggable-item.focus");
            var $value = $item.css("z-index");
            if($(this).hasClass('index-down')){
                $value--;
            }
            else if($(this).hasClass('index-top')){
                $value = 999;
            }
            $item.zIndex($value);
            var data = {
                id: $item.attr("id"),
                value: $value
            };
            submitChange(data, runtime.handlerUrl(element, 'submit_z_index_change'));
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
        $(".customization-tools .dropit-submenu.color-change button").click(function(){
            /* Reset border on all elements, add border color to clicked element. */
            function _setCurrentColors(cls, el){
                $(".customization-tools .dropit-submenu ." + cls).css("border-color", "#d2c9c9");
                $(el).css("border-color", "#3E51B5");
            };

            var $item = $(".draggable-item.focus");

            if($(this).hasClass("text-color")){
               _setCurrentColors("text-color", this);
            }
            else if($(this).hasClass("background-color")){
                _setCurrentColors("background-color", this);
            }
            else if($(this).hasClass("border-color")){
                _setCurrentColors("border-color", this);
            }

            var data = {
                id: $item.attr('id'),
                value: $(this).data('color')
            };

            function _setItemColor(attr, el){
                $item.css(attr, el.data('color'));
            };

            if($(this).hasClass("text-color")){
                _setItemColor("color", $(this));
                data.type = 'color';
                submitChange(data, runtime.handlerUrl(element, 'submit_color_change'));
            }
            else if($(this).hasClass("background-color")){
                _setItemColor("background-color", $(this));
                data.type = 'background-color';
                submitChange(data, runtime.handlerUrl(element, 'submit_color_change'));
            }
            else if($(this).hasClass("border-color")){
                _setItemColor("border-color", $(this));
                data.type = 'border-color';
                submitChange(data, runtime.handlerUrl(element, 'submit_color_change'));
            }
        });

        $("#download-wireframe").click(function(event){
            console.log("Downloading png...");
            html2canvas($(".wireframe-canvas"), {
                onrendered: function(canvas) {
                    var link = document.getElementById("download-wireframe-link");
                    var dataURL = canvas.toDataURL();
                    link.href = dataURL;
                    link.download = "wireframe.png";
                    link.click();
                }
            });

        });

        $('.share-icon').click(function () {
            $('.share-icon').css("color", "#B2B9E1").removeClass("share-social-media");     
            $(this).css("color", "#3E51B5").addClass("share-social-media");
            $(".posting-message").remove();
            $('#slack-channels').hide();

            $("#share-social-message").val("");
            $('.share-social-message-container').show();   

            if($(this).hasClass("fa-slack")){
                $('#slack-channels').show();   
            }   

        });

        $('#share-social-button').click(function () {
            var image_caption = $("#share-social-message").val();
            var slack_channels = $("#slack-channels").val();
            $(".share-social-message-container").hide();
            $(".share-wireframe-submenu li").append("<p class='posting-message'>Posting...</p>");

            var media = $(".share-social-media").attr("data-social");

            html2canvas($(".wireframe-canvas"), {
                onrendered: function(canvas) {
                    var image_data = canvas.toDataURL("image/png");   

                    if(media == "facebook"){
                        console.log("Posting to Facebook...");
                        facebookShare(image_data, image_caption);
                    }
                    else if(media == "twitter"){
                        console.log("Sharing to Twitter...");
                        twitterShare(image_data, image_caption);
                    }
                    else if(media == "slack"){
                        console.log("Sharing to Slack...");
                        slackShare(image_data, image_caption, slack_channels);
                    }
                    else if(media == "imgur"){
                        console.log("Sharing to Imgur...");
                        imgurShare(image_data, image_caption);
                    }
                }
            });        
        });

        $(".undo-action, .redo-action").click(function(){
            $.ajax({
                type: 'POST',
                url: (($(this).hasClass("undo-action")) ? runtime.handlerUrl(element, 'undo_action') : runtime.handlerUrl(element, 'redo_action')),
                data: JSON.stringify(''),
                success: function(data){
                    /* Clear wireframe canvas before applying item state */
                    $(".wireframe-canvas").empty();
                    for (var key in data) {
                        if (data.hasOwnProperty(key)) {
                            /* Create item, append to canvas, change position */         
                            $item = $("<"+ data[key]['type'] + ">", {
                                id: data[key]['id'], 
                                class: data[key]['classes'],
                                'data-cloned': data[key]['cloned'],
                            })
                            /* Append item to canvas and set css values */
                            $(".wireframe-canvas").append($item);
                            $item.css({
                                'position': 'absolute',
                                'top': data[key]['top'],
                                'left': data[key]['left'],
                                'width': data[key]['width'],
                                'height': data[key]['height'],
                                'z-index': data[key]['z-index'],
                                'color': data[key]['color'],
                                'background-color': data[key]['background-color'],
                                'border-color': data[key]['border-color'],
                                'font-size': data[key]['font-size'],
                            });
                            /* Append content to item */
                            $item.append(data[key]['content']);
                        }           
                    }
                    /* Reinitialize draggable and resizable */
                    initDraggable();
                    initResizable();
                },
                error: function (data) {
                    console.log("Error occured duting undo-redo function.");
                }
            });
        });

    };

    function initDroppable() {
        $( ".wireframe-canvas" ).droppable({
            tolerance: "fit",
            drop: function( event, ui ) {

                /* Get dropped item */
                var $item = $(ui.draggable);

                /* If item was dropped for the first time. */
                if(!$(ui.draggable).attr('data-cloned')){
                    /* Clone dropped element with no events */
                    $item = $item.clone();

                    /* Set position where item was dropped. */
                    $item.css({
                        'position': 'absolute',
                        'top': ui['position']['top'],
                        'left': ui['position']['left'],
                        'z-index': 999
                    });

                    /* Set data-cloned to true */
                    $item.attr('data-cloned', true);

                    /* Generate item id and apply it item on canvas */ 
                    var item_id = generateId();
                    $item.attr('id', item_id)

                    /* Append element to canvas. */
                    $item.appendTo(".wireframe-canvas");

                    /* Set up data and submit */
                    var data = {
                        id: item_id,
                        type: $item.prop('nodeName'),
                        classes: $item.attr("class"),
                        cloned: true,
                        top: ui['position']['top'],
                        left: ui['position']['left'],
                        zindex: 999,
                        content: $item.html()
                    };
                    submitChange(data, runtime.handlerUrl(element, 'submit_item_placed'));
                }
                /* Item was in canvas already, save only position values. */
                else{
                    var data = {
                        id: $item.attr('id'),
                        top: ui['position']['top'],
                        left: ui['position']['left']
                    };
                    submitChange(data, runtime.handlerUrl(element, 'submit_position_change'));
                }
                                
                /* Reset draggable event. */
                $item.draggable({ disabled: true });
                $item.draggable("enable");
                $item.draggable({ 
                    containment: $('.wireframe-canvas'),
                    snap: '.wireframe-canvas',
                    snapTolerance: 10,
                    //grid: [ 10, 10 ],
                });

                initResizable();

                /* Show items menu after item is dropped on canvas */
                $('.gn-menu-wrapper').animate({
                    opacity: 'show'
                }, 'fast');
            }
        });
    };

    function initDraggable() {
        $('.wireframe-block').find('.draggable-item').each(function() {
            $(this).draggable({
                containment: $('.wireframe-canvas'),
                snap: '.wireframe-canvas',
                snapTolerance: 10,
                //grid: [ 10, 10 ],
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
        $( "#font-size-slider" ).slider({
            min: 1,
            max: 30,
            step: 1,
            slide: function( event, ui ) {
                $(".font-size").text(ui.value);
                $(".draggable-item.focus").css("font-size", ui.value);
            },
            stop: function( event, ui ) {
                var data = {
                    id: $(".draggable-item.focus").attr("id"),
                    fontSize: ui.value
                };
                submitChange(data, runtime.handlerUrl(element, 'submit_size_change'));
            }
        });
    };

    function initResizable(){
        $(".wireframe-canvas .draggable-item.draggable-box, .wireframe-canvas .draggable-item.draggable-p, .wireframe-canvas .draggable-item.draggable-textarea").resizable({
            grid: 10,
            containment: ".wireframe-canvas",
            stop: function(event, ui) {
                var data = {
                    id: $(this).attr("id"),
                    width: $(this).css("width"),
                    height: $(this).css("height")
                };
                submitChange(data, runtime.handlerUrl(element, 'submit_width_height_change'));
            }
        });     
    };

    function dataURItoBlob(dataURI) {
        // convert base64/URLEncoded data component to raw binary data held in a string
        var byteString;
        if (dataURI.split(',')[0].indexOf('base64') >= 0)
            byteString = atob(dataURI.split(',')[1]);
        else
            byteString = unescape(dataURI.split(',')[1]);
        // separate out the mime component
        var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
        // write the bytes of the string to a typed array
        var ia = new Uint8Array(byteString.length);
        for (var i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }
        return new Blob([ia], {type:mimeString});
    };

    function facebookShare(image_data, image_caption){
        OAuth.popup("facebook").then(function(result) {
            try {
                blob = dataURItoBlob(image_data);
            } catch (e) {
                console.log(e);
            }
            var data = new FormData();
            data.append("source", blob);
            data.append("no_story", false);
            data.append("caption", image_caption);
            return result.post('https://graph.facebook.com/me/photos', {
                data: data,
                cache: false,
                processData: false,
                contentType: false
            });
        }).done(function(data){
            var str = JSON.stringify(data, null, 2);
            console.log("Success\n" + str);
            oauthDone("Facebook");  
        }).fail(function(e){
            var errorTxt = JSON.stringify(e, null, 2)
            console.log("Error\n" + errorTxt);
        });
    };

    function twitterShare(image_data, image_caption){
        OAuth.popup("twitter").then(function(result) {
            var data = new FormData();
            data.append('status', image_caption);
            data.append('media[]', dataURItoBlob(image_data), 'wireframe.png');
            return result.post('/1.1/statuses/update_with_media.json', {
                data: data,
                cache: false,
                processData: false,
                contentType: false
            });
        }).done(function(data){
            var str = JSON.stringify(data, null, 2);
            console.log("Success\n" + str);
            oauthDone("Twitter");  
        }).fail(function(e){
            var errorTxt = JSON.stringify(e, null, 2)
            console.log("Error\n" + errorTxt);
        });
    };

    function slackShare(image_data, image_caption, channels){
        OAuth.popup("slack").then(function(result) {
            var data = new FormData();
            data.append('initial_comment', image_caption);
            data.append('file', dataURItoBlob(image_data));
            data.append('filetype', 'png');
            data.append('filename', 'wireframe.png');
            if(channels){
                data.append('channels', channels);
            }          
            return result.post('https://slack.com/api/files.upload', {
                data: data,
                cache: false,
                processData: false,
                contentType: false
            });
        }).done(function(data){
            var str = JSON.stringify(data, null, 2);
            console.log("Success\n" + str);
            oauthDone("Slack"); 
        }).fail(function(e){
            var errorTxt = JSON.stringify(e, null, 2)
            console.log("Error\n" + errorTxt);
        });
    };

    function imgurShare(image_data, image_caption){
        OAuth.popup("imgur").then(function(result) {
            try {
                blob = dataURItoBlob(image_data);
            } catch (e) {
                console.log(e);
            }
            var data = new FormData();
            data.append('image', blob);
            data.append('title', image_caption);
            return result.post('https://api.imgur.com/3/image', {
                data: data,
                cache: false,
                processData: false,
                contentType: false
            });
        }).done(function(data){
            var str = JSON.stringify(data, null, 2);
            console.log("Success\n" + str);
            oauthDone("Imgur");  
        }).fail(function(e){
            var errorTxt = JSON.stringify(e, null, 2)
            console.log("Error\n" + errorTxt);
        });
    };

    function oauthDone(platform){
        $(".posting-message").remove();
        $(".share-wireframe-submenu li").append("<p class='posting-message-completed'>Your wireframe has been shared to " + platform + "!</p>");
        setTimeout(function () {
            $(".posting-message-completed").remove();
        }, 5000);
        $('.share-icon').css("color", "#3E51B5"); 
        $('.share-icon').removeClass("share-social-media"); 
    };
    
    function submitChange(data, url){
        $.ajax({
            type: 'POST',
            url: url,
            data: JSON.stringify(data),
            success: function(data){
            }
        });
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
        renderElements();
        initDraggable();
        initDroppable();
        initAccordion();
        initDropMenu();
        initResizable();
        initDropMenuSlider();
        setClickEvents();

        OAuth.initialize('V-cf3lhELIG0c9rladxS2LCZ0KI');
    });
    
}