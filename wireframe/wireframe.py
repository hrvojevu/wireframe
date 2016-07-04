"""TO-DO: Write a description of what this XBlock is."""

import pkg_resources
import json
import urllib
import logging

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
        grid_image_url = self.runtime.local_resource_url(self, 'static/images/grid4.png')

        context = {
            'self': self,
            'grid_image_url': grid_image_url,
        }

        frag = Fragment()
        frag.add_content(loader.render_template('/static/html/wireframe.html', context))
        frag.add_css(self.resource_string("static/css/wireframe.css"))
        frag.add_css(self.resource_string("static/spectrum-colorpicker/spectrum.css"))
        frag.add_css(self.resource_string("static/menu-files/css/normalize.css"))
        frag.add_css(self.resource_string("static/menu-files/css/component.css"))
        frag.add_javascript(self.resource_string("static/js/src/wireframe.js"))
        frag.add_javascript(self.resource_string("static/spectrum-colorpicker/spectrum.js"))
        frag.add_javascript(self.resource_string("static/menu-files/js/classie.js"))
        frag.add_javascript(self.resource_string("static/menu-files/js/gnmenu.js"))
        frag.add_javascript(self.resource_string("static/menu-files/js/modernizr.custom.js"))
        frag.initialize_js('WireframeXBlock', self.get_configuration())

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
        #js_templates = loader.load_unicode('/static/html/js_templates.html')
        context = {
            #'js_templates': js_templates,
            'self': self,
            #'data': urllib.quote(json.dumps(self.data)),
        }

        frag = Fragment()
        frag.add_content(loader.render_template('/static/html/wireframe_edit.html', context))
        frag.add_css(self.resource_string("static/css/wireframe_edit.css"))
        frag.add_javascript(self.resource_string("static/js/src/wireframe_edit.js"))
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
    def submit_location(self, data, suffix=''):
        logging.error("-------data------------------")
        logging.error(data)
        logging.error("-------------------------")

        #if not any(item.get('id', None) == data.get('id') for item in self.items_placed):
        logging.error("#### FOR ####")
        item_id = data.get('id')

        item = {
            'id': item_id,
            'type': data.get('type'),
            'classes': data.get('classes'),
            'cloned': data.get('cloned'),
            'top': data.get('top'),
            'left': data.get('left')
        }  

        if not self.items_placed:    
            logging.error("Dict empty, appending item.")      
            self.items_placed[item_id] = item

            return "Success"

        else:
            logging.error("List not empty, checking if item in list")
            if item_id in self.items_placed:
                logging.error(item['id'])
                logging.error("Item is in list, changing position")
                self.items_placed[item_id]['top'] = data.get('top')
                self.items_placed[item_id]['left'] = data.get('left')

                return "Success"
            else:
                logging.error(item['id'])
                logging.error("Item not in dict, appending item to dict") 
                self.items_placed[item_id] = item

                return "Success"

    @XBlock.json_handler
    def submit_background_color(self, data, suffix=''):
        return "Success"

    @XBlock.json_handler
    def reset(self, data, suffix=''):
        self.items_placed = {}

        return "Success"