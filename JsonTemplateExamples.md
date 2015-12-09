  * The [articles in the doc directory](http://json-template.googlecode.com/hg/doc/) are [generated](http://json-template.googlecode.com/hg/doc/makedocs.py) using a [template](http://json-template.googlecode.com/hg/doc/html.jsont).
  * The [syntax highlighter](http://json-template.googlecode.com/hg/python/jsontemplate/highlight.py) uses it.

### Using more\_formatters ###

The `more_formatters` constructor argument lets you define a **function** which **returns** more formatting functions (in Java, these are classes).

On the [Reference](Reference.md) page, we've defined the names for standard formatters.  But these are just reserved names -- specific implementations may or may not provide them by default.

In Python and JavaScript, the `json` / `js-string` formatters aren't defined by default because they require a dependency on more code which people may or may not want.  To hook them up, you will need [json2.js](http://json.org/json2.js) (or equivalent) in JavaScript and [simplejson](http://code.google.com/p/simplejson) or equivalent in Python.

Examples:

JavaScript:

```
function more_formatters(formatter_name) {
  if formatter_name === 'json' || formatter_name === 'js-string' {
    return JSON.stringify;
  } else {
    return null;
  }
}

t = jsontemplate.Template("{foo|js-string}", {more_formatters: more_formatters});
```

Python:

```
def more_formatters(formatter_name):
  if formatter_name == 'json' or formatter_name == 'js-string':
    return simplejson.dumps
  else:
    return None

t = jsontemplate.Template("{foo|js-string}", more_formatters=more_formatters)
```