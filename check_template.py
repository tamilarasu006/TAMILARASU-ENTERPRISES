from jinja2 import Environment, FileSystemLoader, select_autoescape

env = Environment(
    loader=FileSystemLoader('templates'),
    autoescape=select_autoescape(['html']),
)

try:
    tpl = env.get_template('catalog.html')
    print('Template parsed OK')
except Exception as e:
    print('ERROR:', e)
