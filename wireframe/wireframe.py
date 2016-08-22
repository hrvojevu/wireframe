"""TO-DO: Write a description of what this XBlock is."""

import cgi
import pkg_resources
import json
import urllib
import logging

from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import redirect
from webob import Response
from xblock.core import XBlock
from xblock.exceptions import JsonHandlerError
from xblock.fields import Scope, Integer, String, Dict, Boolean, List
from xblock.fragment import Fragment
from xblockutils.resources import ResourceLoader
from xblockutils.settings import XBlockWithSettingsMixin, ThemableXBlockMixin

loader = ResourceLoader(__name__)

class WireframeXBlock(XBlock, XBlockWithSettingsMixin, ThemableXBlockMixin):
    """
    XBlock that implements drag and drop functionality for creating wireframe.
    """

    display_name = String(
        display_name ="Display Name",
        default="Wireframe",
        scope=Scope.settings
    )

    canvas_width = Integer(
        display_name="Canvas width",
        default=500,
        scope=Scope.settings,
        help="Set the width of droppable zone"
    )

    canvas_height = Integer(
        display_name="Canvas height",
        default=500,
        scope=Scope.settings,
        help="Set the height of droppable zone"
    )

    duplicate_elements = Boolean(
        display_name="Duplicate",
        default=True,
        scope=Scope.settings,
        help="Determine if elements are duplicated when dropped or not"
    )

    items_placed = Dict(
        display_name="Placed items Dict.",
        default={},
        scope=Scope.user_state,
        help="Dictionary containing placed items info."
    )

    undo_redo_state = Dict(
        display_name="Undo Dictionary",
        default={},
        scope=Scope.user_state,
        help="Dictionary containing every change made in Wireframe."
    )

    undo_redo_state_counter = Integer(
        display_name="Undo redo state counter",
        default=0,
        scope=Scope.user_state,
        help="Number of states in Dict for undo and redo"
    )

    undo_redo_state_position = Integer(
        display_name="Undo redo state position",
        default=0,
        scope=Scope.user_state,
        help="Position of state in undo redo Dict"
    )

    def resource_string(self, path):
        """Handy helper for getting resources from our kit."""
        data = pkg_resources.resource_string(__name__, path)
        return data.decode("utf8")

    # TO-DO: change this view to display your data your own way.
    def student_view(self, context=None):
        """
        The primary view of the WireframeXBlock, shown to students
        when viewing courses.
        """
        grid_image_url = self.runtime.local_resource_url(self, 'public/images/grid4.png')

        context = {
            'self': self,
            'grid_image_url': grid_image_url
        }

        frag = Fragment()
        frag.add_content(loader.render_template('/public/html/wireframe.html', context))
        frag.add_css(self.resource_string("public/css/wireframe.css"))
        frag.add_css(self.resource_string("public/plugins/medium-editor/css/medium-editor.css"))
        frag.add_css(self.resource_string("public/plugins/medium-editor/css/themes/default.css"))
        frag.add_css(self.resource_string("public/plugins/dropit/dropit.css"))
        frag.add_css(self.resource_string("public/plugins/menu-files/css/normalize.css"))
        frag.add_css(self.resource_string("public/plugins/menu-files/css/component.css"))
        frag.add_javascript(self.resource_string("public/js/vendors/jquery.fileupload.js"))
        frag.add_javascript(self.resource_string("public/js/vendors/csrf.js"))
        frag.add_javascript(self.resource_string("public/js/vendors/oauth.js"))           
        frag.add_javascript(self.resource_string("public/js/src/wireframe.js"))           
        frag.add_javascript(self.resource_string("public/plugins/medium-editor/js/medium-editor.js"))
        frag.add_javascript(self.resource_string("public/plugins/dropit/dropit.js"))
        frag.add_javascript(self.resource_string("public/plugins/html2canvas/html2canvas.js"))
        frag.add_javascript(self.resource_string("public/plugins/menu-files/js/classie.js"))
        frag.add_javascript(self.resource_string("public/plugins/menu-files/js/gnmenu.js"))
        frag.add_javascript(self.resource_string("public/plugins/menu-files/js/modernizr.custom.js"))
        frag.initialize_js('WireframeXBlock', self.get_configuration())

        # Reset undo redo state and state position on page load or refresh
        self.undo_redo_state = {}
        self.undo_redo_state_position = 0

        return frag

    def get_configuration(self):
        return {
            "items_placed": self.items_placed,
        }

    # TO-DO: change this to create the scenarios you'd like to see in the
    # workbench while developing your XBlock.
    @staticmethod
    def workbench_scenarios():
        """A canned scenario for display in the workbench."""
        return [
            ("WireframeXBlock",
             """<wireframe/>
             """),
            ("Multiple WireframeXBlock",
             """<vertical_demo>
                <wireframe/>
                <wireframe/>
                <wireframe/>
                </vertical_demo>
             """),
        ]

    def studio_view(self, context):
        """
        Editing view in Studio
        """
        #js_templates = loader.load_unicode('/public/html/js_templates.html')
        context = {
            #'js_templates': js_templates,
            'self': self,
            #'data': urllib.quote(json.dumps(self.data)),
        }

        frag = Fragment()
        frag.add_content(loader.render_template('/public/html/wireframe_edit.html', context))
        frag.add_css(self.resource_string("public/css/wireframe_edit.css"))
        frag.add_javascript(self.resource_string("public/js/src/wireframe_edit.js"))
        frag.initialize_js('WireframeEditBlock', {
            #'data': self.data,
        })

        return frag

    @XBlock.json_handler
    def studio_submit(self, data, suffix=''):
        """
        Called when submitting the form in Studio.
        """
        self.display_name = data.get('name')
        self.duplicate_elements = data.get('duplicate')
        self.canvas_height = data.get('height')
        self.canvas_width = data.get('width')

        return {
            'result': 'success',
        }

    @XBlock.json_handler
    def submit_item_placed(self, data, suffix=''):
        item_id = data.get('id')
        item = {
            'id': item_id,
            'type': data.get('type'),
            'classes': data.get('classes'),
            'cloned': data.get('cloned'),
            'top': data.get('top'),
            'left': data.get('left'),
            'z-index': data.get('zindex'),
            'content': data.get('content')
        }  
        self.items_placed[item_id] = item
        self.set_undo_redo_state(self.items_placed)
        return

    @XBlock.json_handler
    def submit_position_change(self, data, suffix=''):
        item_id = data.get('id')
        self.items_placed[item_id]['top'] = data.get('top')
        self.items_placed[item_id]['left'] = data.get('left')
        self.set_undo_redo_state(self.items_placed)
        return

    @XBlock.json_handler
    def submit_color_change(self, data, suffix=''):
        item_id = data.get('id')
        color_type = data.get('type')
        self.items_placed[item_id][color_type] = data.get('value')
        self.set_undo_redo_state(self.items_placed)
        return

    @XBlock.json_handler
    def submit_z_index_change(self, data, suffix=''):
        item_id = data.get('id')
        self.items_placed[item_id]['z-index'] = data.get('value')  
        self.set_undo_redo_state(self.items_placed)      
        return

    @XBlock.json_handler
    def submit_width_height_change(self, data, suffix=''):
        item_id = data.get('id')
        self.items_placed[item_id]['width'] = data.get('width')       
        self.items_placed[item_id]['height'] = data.get('height')    
        self.set_undo_redo_state(self.items_placed)   
        return

    @XBlock.json_handler
    def submit_size_change(self, data, suffix=''):
        item_id = data.get('id')
        self.items_placed[item_id]['font-size'] = data.get('fontSize')
        self.set_undo_redo_state(self.items_placed)             
        return

    @XBlock.json_handler
    def submit_text_edit(self, data, suffix=''):
        item_id = data.get('id')
        self.items_placed[item_id]['content'] = data.get('content')     
        self.set_undo_redo_state(self.items_placed)      
        return

    def set_undo_redo_state(self, state, suffix=''):
        # If undo_redo_state is not empty and if length of it is larger than undo_redo_state_position
        # Delete all items from Dict that are larger than undo_redo_state_position
        if self.undo_redo_state and len(self.undo_redo_state) > self.undo_redo_state_position:
            for key in self.undo_redo_state.keys():
                if int(key) > self.undo_redo_state_position:
                    del self.undo_redo_state[key]

        # Increment undo_redo_state_position and add state to undo_redo_state Dict
        self.undo_redo_state_position += 1
        self.undo_redo_state[self.undo_redo_state_position] = state
        return 

    @XBlock.json_handler
    def undo_action(self, data, suffix=''):
        # If undo_redo_state exists, allow undo functionality
        if self.undo_redo_state:
            # If undo_redo_state_position decremented equals 0 or less, do nothing and reset position,state and items_placed
            if self.undo_redo_state_position-1 <= 0:
                self.undo_redo_state_position = 0
                state = None
                self.items_placed = {}
            # Else decrement position, get state by position and set items_placed to match state
            else:
                self.undo_redo_state_position -= 1
                state = self.undo_redo_state[str(self.undo_redo_state_position)]
                self.items_placed = state
            return state
        # Else just return items_placed
        else:
            return self.items_placed

    @XBlock.json_handler
    def redo_action(self, data, suffix=''):
        if self.undo_redo_state_position > 0:
            # If undo_redo_state_position incremented is NOT bigger than Dict length, increment it
            if not self.undo_redo_state_position+1 > len(self.undo_redo_state):
                self.undo_redo_state_position += 1

            # Get wanted state, set it and return it
            state = self.undo_redo_state[str(self.undo_redo_state_position)]
            self.items_placed = state
            return state
        else:
            return None   

    @XBlock.json_handler
    def remove_item(self, data, suffix=''):
        item_id = data.get('id')
        del self.items_placed[item_id]
        return

    @XBlock.json_handler
    def reset(self, data, suffix=''):
        self.items_placed = {}
        self.undo_redo_state = {}
        self.undo_redo_state_position = 0
        return