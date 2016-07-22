/*
 * Dropit v1.1.0
 * http://dev7studios.com/dropit
 *
 * Copyright 2012, Dev7studios
 * Free to use and abuse under the MIT license.
 * http://www.opensource.org/licenses/mit-license.php
 */

;(function($) {

    $.fn.dropit = function(method) {

        var methods = {

            init : function(options) {
                this.dropit.settings = $.extend({}, this.dropit.defaults, options);
                return this.each(function() {
                    var $el = $(this),
                         el = this,
                         settings = $.fn.dropit.settings;

                    // Hide initial submenus
                    $el.addClass('dropit')
                    .find('>'+ settings.triggerParentEl +':has('+ settings.submenuEl +')').addClass('dropit-trigger')
                    .find(settings.submenuEl).addClass('dropit-submenu').hide();

                    // Open on click
                    $el.off(settings.action).on(settings.action, settings.triggerParentEl +':has('+ settings.submenuEl +') > '+ settings.triggerEl +'', function(){
                        // Close click menu's if clicked again
                        if(settings.action == 'click' && $(this).parents(settings.triggerParentEl).hasClass('dropit-open')){
                            settings.beforeHide.call(this);
                            $(this).parents(settings.triggerParentEl).removeClass('dropit-open').find(settings.submenuEl).hide();
                            settings.afterHide.call(this);
                            return false;
                        }

                        // Reset hidden containers
                        $(".text-color-container").show();

                        // Hide open menus
                        settings.beforeHide.call(this);
                        $('.dropit-open').removeClass('dropit-open').find('.dropit-submenu').hide();
                        settings.afterHide.call(this);

                        // Open this menu
                        settings.beforeShow.call(this);
                        $(this).parents(settings.triggerParentEl).addClass('dropit-open').find(settings.submenuEl).show();
                        settings.afterShow.call(this);

                        var $focused_item = $(".draggable-item.focus");

                        // If clicked menu has color change submenu 
                        if($el.find(".color-change").length != 0){
                            // When menu is opened, reset borders and set correct border to button elements based on current colors
                            $(settings.submenuEl + ".color-change").find('.text-color, .background-color, .border-color').css("border-color", "#d2c9c9");
                            $(settings.submenuEl + ".color-change").find('.text-color[data-color="' + $focused_item.css("color") + '"]').css("border-color", "#3E51B5");
                            $(settings.submenuEl + ".color-change").find('.background-color[data-color="' + $focused_item.css("background-color") + '"]').css("border-color", "#3E51B5");
                            $(settings.submenuEl + ".color-change").find('.border-color[data-color="' + $focused_item.css("border-color") + '"]').css("border-color", "#3E51B5");

                        }
                        // If clicked menu has font change submenu 
                        else if($el.find(".size-change").length != 0){
                            // Set slider value to match focused item font size value
                            $(settings.submenuEl + ".size-change").find(".font-size").text($focused_item.css("font-size"));
                            $("#font-size-slider").slider({
                                value: $focused_item.css("font-size").replace("px", ""),
                            });
                        }

                        // If focused item is link, dont show text color options
                        if($focused_item.hasClass("draggable-link") || $focused_item.hasClass("draggable-box")){
                            console.log("has class link");
                            $(".text-color-container").hide();
                        }                       

                        return false;
                    });
                    
                    // Close if wireframe canvas was clicked
                    $(document).click(function(event) {
                        if(!$(event.target).parents().hasClass("dropit-open")){
                            $('.dropit-open').removeClass('dropit-open').find('.dropit-submenu').hide();
                        }
                    });
                    // Close if outside click
                    /*
                    $(document).on('click', function(){
                        settings.beforeHide.call(this);
                        $('.dropit-open').removeClass('dropit-open').find('.dropit-submenu').hide();
                        settings.afterHide.call(this);
                    });
                    */

                    // If hover
                    if(settings.action == 'mouseenter'){
                        $el.on('mouseleave', '.dropit-open', function(){
                            settings.beforeHide.call(this);
                            $(this).removeClass('dropit-open').find(settings.submenuEl).hide();
                            settings.afterHide.call(this);
                        });
                    }

                    settings.afterLoad.call(this);
                });
            }

        };

        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
            return methods.init.apply(this, arguments);
        } else {
            $.error( 'Method "' +  method + '" does not exist in dropit plugin!');
        }

    };

    $.fn.dropit.defaults = {
        action: 'click', // The open action for the trigger
        submenuEl: 'ul', // The submenu element
        triggerEl: 'a', // The trigger element
        triggerParentEl: 'li', // The trigger parent element
        afterLoad: function(){}, // Triggers when plugin has loaded
        beforeShow: function(){}, // Triggers before submenu is shown
        afterShow: function(){}, // Triggers after submenu is shown
        beforeHide: function(){}, // Triggers before submenu is hidden
        afterHide: function(){} // Triggers before submenu is hidden
    };

    $.fn.dropit.settings = {};

})(jQuery);
