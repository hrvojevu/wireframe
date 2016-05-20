"""TO-DO: Write a description of what this XBlock is."""

import pkg_resources

from xblock.core import XBlock
from xblock.fields import Scope, Integer, String
from xblock.fragment import Fragment


class WireframeXBlock(XBlock):
    """
    TO-DO: document what your XBlock does.
    """

    # Fields are defined on the class.  You can access them in your code as
    # self.<fieldname>.

    # TO-DO: delete count, and define your own fields.
    display_name = String(
        display_name = "Display Name",
        default="Wireframe",
        scope=Scope.settings
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
        html = self.resource_string("static/html/wireframe.html")
        frag = Fragment(html.format(self=self))
        frag.add_css(self.resource_string("static/css/wireframe.css"))
        frag.add_javascript(self.resource_string("static/js/src/wireframe.js"))
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
        Create a fragment used to display the edit view in the Studio.
        """
        frag = Fragment()

        return frag
