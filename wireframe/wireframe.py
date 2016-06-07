"""TO-DO: Write a description of what this XBlock is."""

import pkg_resources
import json
import urllib
import logging

from xblock.core import XBlock
from xblock.exceptions import JsonHandlerError
from xblock.fields import Scope, Integer, String, Dict, Boolean
from xblock.fragment import Fragment
from xblockutils.resources import ResourceLoader
from xblockutils.settings import XBlockWithSettingsMixin, ThemableXBlockMixin

loader = ResourceLoader(__name__)

class WireframeXBlock(XBlock, XBlockWithSettingsMixin, ThemableXBlockMixin):
    """
    TO-DO: document what your XBlock does.
    """

    # Fields are defined on the class.  You can access them in your code as
    # self.<fieldname>.

    # TO-DO: delete count, and define your own fields.
    display_name = String(
        display_name ="Display Name",
        default="Wireframe",
        scope=Scope.settings
    )

    canvas_width = Integer(
        display_name="Canvas width",
        help="Set the width of droppable zone",
        scope=Scope.settings,
        default=500,
    )

    canvas_height = Integer(
        display_name="Canvas height",
        help="Set the height of droppable zone",
        scope=Scope.settings,
        default=500,
    )

    duplicate_elements = Boolean(
        display_name="Duplicate",
        help="Determine if elements are duplicated when dropped or not",
        scope=Scope.settings,
        default=True,
    )

    count = Integer(
        default=0, scope=Scope.user_state,
        help="A simple counter, to show something happening",
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
        context = {
            'self': self,
        }

        frag = Fragment()
        frag.add_content(loader.render_template('/static/html/wireframe.html', context))
        frag.add_css(self.resource_string("static/css/wireframe.css"))
        frag.add_css(self.resource_string("static/menu-files/css/normalize.css"))
        frag.add_css(self.resource_string("static/menu-files/css/component.css"))
        frag.add_javascript(self.resource_string("static/js/src/wireframe.js"))
        frag.add_javascript(self.resource_string("static/menu-files/js/modernizr.custom.js"))
        frag.initialize_js('WireframeXBlock')
        return frag

    # TO-DO: change this handler to perform your own actions.  You may need more
    # than one handler, or you may not need any handlers at all.
    @XBlock.json_handler
    def increment_count(self, data, suffix=''):
        """
        An example handler, which increments the data.
        """
        # Just to show data coming in...
        assert data['hello'] == 'world'

        self.count += 1
        return {"count": self.count}

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