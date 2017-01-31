from bottle import route, run, template, static_file
from mako.template import Template
import os

@route('/static/<filepath:path>')
def static(filepath):
    return static_file(filepath, root='./static')

@route('/')
def index():
    return Template(filename=os.path.join('static','index.html')).render()

run(host='0.0.0.0', port=int(os.environ.get("PORT", 8080)))
