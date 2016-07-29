"""TO-DO: Write a description of what this XBlock is."""

import cgi
import pkg_resources
import json
import urllib
import logging
import oauth2 as oauth
import tweepy
import base64

from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import redirect
from webob import Response
from xblock.core import XBlock
from xblock.exceptions import JsonHandlerError
from xblock.fields import Scope, Integer, String, Dict, Boolean, List
from xblock.fragment import Fragment
from xblockutils.resources import ResourceLoader
from xblockutils.settings import XBlockWithSettingsMixin, ThemableXBlockMixin
# Import private.py file where social media access credentials are stored
from .private import *
from PIL import Image
from tweepy.auth import OAuthHandler

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

    undo_redo = Dict(
        display_name="Undo Dictionary",
        default={},
        scope=Scope.user_state,
        help="Dictionary containing every change made in Wireframe."
    )

    consumer = oauth.Consumer(TWITTER_CREDENTIALS['CONSUMER_KEY'], TWITTER_CREDENTIALS['CONSUMER_SECRET'])
    client = oauth.Client(consumer)
    authenticate_url = 'https://api.twitter.com/oauth/authenticate'

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
        frag.add_javascript(self.resource_string("public/js/src/wireframe.js"))           
        frag.add_javascript(self.resource_string("public/plugins/medium-editor/js/medium-editor.js"))
        frag.add_javascript(self.resource_string("public/plugins/dropit/dropit.js"))
        frag.add_javascript(self.resource_string("public/plugins/html2canvas/html2canvas.js"))
        frag.add_javascript(self.resource_string("public/plugins/menu-files/js/classie.js"))
        frag.add_javascript(self.resource_string("public/plugins/menu-files/js/gnmenu.js"))
        frag.add_javascript(self.resource_string("public/plugins/menu-files/js/modernizr.custom.js"))
        frag.initialize_js('WireframeXBlock', self.get_configuration())

        return frag

    def get_configuration(self):
        return {
            "items_placed": self.items_placed,
            'facebook_app_id': FACEBOOK_CREDENTIALS['APP_ID'],
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
        return

    @XBlock.json_handler
    def submit_position_change(self, data, suffix=''):
        item_id = data.get('id')
        self.items_placed[item_id]['top'] = data.get('top')
        self.items_placed[item_id]['left'] = data.get('left')
        return

    @XBlock.json_handler
    def submit_color_change(self, data, suffix=''):
        item_id = data.get('id')
        color_type = data.get('type')
        self.items_placed[item_id][color_type] = data.get('value')
        return

    @XBlock.json_handler
    def submit_z_index_change(self, data, suffix=''):
        item_id = data.get('id')
        self.items_placed[item_id]['z-index'] = data.get('value')        
        return

    @XBlock.json_handler
    def submit_width_height_change(self, data, suffix=''):
        item_id = data.get('id')
        self.items_placed[item_id]['width'] = data.get('width')       
        self.items_placed[item_id]['height'] = data.get('height')       
        return

    @XBlock.json_handler
    def submit_size_change(self, data, suffix=''):
        item_id = data.get('id')
        self.items_placed[item_id]['font-size'] = data.get('fontSize')             
        return

    @XBlock.json_handler
    def submit_text_edit(self, data, suffix=''):
        item_id = data.get('id')
        self.items_placed[item_id]['content'] = data.get('content')           
        return

    @XBlock.handler
    def twitter_auth(self, data, suffix=''):
        """ Twitter authentication via Tweepy. """
        logging.error("Twitter auth")
        auth = OAuthHandler(TWITTER_CREDENTIALS['CONSUMER_KEY'], TWITTER_CREDENTIALS['CONSUMER_SECRET'])
        auth.set_access_token(TWITTER_CREDENTIALS['ACCESS_TOKEN'], TWITTER_CREDENTIALS['ACCESS_TOKEN_SECRET'])
        logging.error(auth)
        return auth

    @XBlock.handler
    def twitter_login(self, request, suffix=''):
        logging.error("Twitter login")
        logging.error("###REQUEST###")
        logging.error(request)
        # Step 1. Get a request token from Twitter.
        resp, content = self.client.request('https://api.twitter.com/oauth/request_token', "POST")

        if resp['status'] != '200':
            raise Exception("Invalid response from Twitter.")

        # Step 2. Store the request token in a session for later use.
        #request.session['request_token'] = dict(cgi.parse_qsl(content))
        request_token = dict(cgi.parse_qsl(content))

        # Step 3. Redirect the user to the authentication URL.
        url = "%s?oauth_token=%s" % (self.authenticate_url,
                                     request_token['oauth_token'])

        logging.error(url)
        logging.error(request_token)
        logging.error("##############################")
        #return HttpResponseRedirect(url)

        #self.twitter_authenticated(request_token)

        return Response(json.dumps({"oauth_token": request_token['oauth_token']}), content_type='application/json')

    def twitter_authenticated(self, data, suffix=''):
        logging.error("Twitter authenticated")
        logging.error(data)
        logging.error("********************************************************")
        # Step 1. Use the request token in the session to build a new client.
        token = oauth.Token(data['oauth_token'],
                            data['oauth_token_secret'])

        token.set_verifier(request.GET['oauth_verifier'])
        client = oauth.Client(consumer, token)

        # Step 2. Request the authorized access token from Twitter.
        resp, content = client.request(access_token_url, "GET")

        if resp['status'] != '200':
            raise Exception("Invalid response from Twitter.")

        access_token = dict(cgi.parse_qsl(content))

        return

    def decode_base64(self, data):
        """Decode base64, padding being optional.

        :param data: Base64 data as an ASCII byte string
        :returns: The decoded byte string.

        """
        missing_padding = len(data) % 4
        if missing_padding != 0:
            data += b'='* (4 - missing_padding)
        return base64.decodestring(data)

    @XBlock.json_handler
    def twitter_share(self, data, suffix=''):
        dataUrlPattern = re.compile('data:image/(png|jpeg);base64,(.*)$')
        image_data = data.get('image_data')
        image_data = dataUrlPattern.match(image_data).group(2)
        # If none or len 0, means illegal image data
        if image_data == None or len(image_data) == 0:
            # PRINT ERROR MESSAGE HERE
            pass
        # Decode the 64 bit string into 32 bit
        image_data = base64.b64decode(image_data)

        status = data.get("post_name")

        image = open("wireframe.png", "w+")
        image.write(image_data)

        auth = self.twitter_auth()
        api = tweepy.API(auth, parser=tweepy.parsers.JSONParser())
        api.update_with_media(filename="wireframe.png", status=status, file=image)
        return

    @XBlock.json_handler
    def remove_item(self, data, suffix=''):
        item_id = data.get('id')
        del self.items_placed[item_id]
        return

    @XBlock.json_handler
    def reset(self, data, suffix=''):
        self.items_placed = {}
        return