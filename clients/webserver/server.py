import os
import sys

# remove this and do in module launcher
this_dir = os.path.dirname(os.path.realpath(__file__))
core_dir = os.path.join(os.path.dirname(os.path.dirname(this_dir)), 'core')
sys.path.insert(1, core_dir)

import json
from modules import get_socket
from flask import Flask, send_file, jsonify

# configuration
with open('client.json', 'r') as fp:
    conf = json.load(fp)

# flask app
app = Flask(__name__,
        static_folder=conf.get('static_directory', 'static'),
        static_url_path='')

# fix for index page
@app.route('/')
def index():
    return app.send_static_file('index.html')

@app.route('/api/rooms')
def rooms():
    return send_file('rooms.json')

@app.route('/api/modules')
def modules():
    return

if __name__ == '__main__':
    app.run(debug='--debug' in sys.argv or conf.get('debug', False),
            port=int(conf.get('port', 8888)))
