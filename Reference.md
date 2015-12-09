The language is very small.

  * Directives are enclosed in **metacharacters**.  The default metacharacters are { and }.
  * Directives that start with # are comments.
  * Directives that start with a period (.) are built-in language constructs.
  * Anything else within metacharacters is treated as a **variable substitution**.
  * Variables can be formatted with a list of **formatters**, using the | character (or : character, if that _compilation option_ is set).
  * The character '@' is the **cursor value**.  It can be used in a **substitution**, or as the section name of a **repeated section**.

## Variable Substitution ##

A variable is evaluated in a **scoped context**.

A `{.section}` or `{.repeated section}` attempts to **push** the named context onto a stack.  If the key is absent, empty, or `null`, then the section is not expanded into the output.

To substitute a value `foo`, put it within metacharacters in the template: `{foo}`

To substitute it, after running it through the `html` formatter, use this syntax: `{foo|html}`

Example:

```
The value of the variable foo, formatted as HTML is: {foo|html}
```

When looking up a variable name, we start at the top of the stack of contexts.  And then we simply look down the stack until we find it.  If it's not found, then an `UndefinedVariable` exception is raised (or some other language-specific error).  You may also set a default string value for undefined variables.

A **period** performs looks up a field **within** a record (i.e. like a C struct).

Example: `{foo.bar.baz}` will find the value `Hello` within `{"foo": {"bar": {"baz": "Hello"}}}`.

`foo` will be searched for up the stack, but `bar` and `baz` are simple lookups.

## Built-in Directives ##

| **Example** | **Meaning** |
|:------------|:------------|
| {# This is comment} | A single line comment. |
| {##BEGIN} multiline comment {##END} | A multiline comment (implemented in Python only) |
| {.section _foo_} | Starts a **section** named _foo_.  The **name** corresponds to a JSON **key**.  The section is expanded iff the key is present and not false (`{}`, `[]`, `null`, and `false` are considered "false" values)  |
| {.repeated section _bar_} | Starts a **repeated section** named _bar_. The **name** corresponds to a JSON **key**, whose value is a **list** of dictionaries or strings. The section is expanded once for each element of the list. |
| {.end}      | Ends a section or repeated section. |

## Clauses ##

| {.or} | A block to be expanded if the section or repeated section is **missing or false**. |
|:------|:-----------------------------------------------------------------------------------|
| {.alternates with} | This can only appear at the same level as a **repeated section**.  This block is expanded in between every pair of repeating sections (e.g. for placing dividers). |

## Literals ##

| **Name** | **Meaning** |
|:---------|:------------|
| {.space} | Inserts a literal space character. |
| {.tab}   | Inserts a literal tab (\t) character. |
| {.newline} | Inserts a literal newline (\n) character. |
| {.meta-left} | Inserts the left metacharacter, e.g. { |
| {.meta-right} | Inserts the right metacharacter, e.g. } |

## Formatters ##

You can set the default formatter in the constructor of the `Template` class, or in the first few lines of the template, e.g `default-formatter: html` as the first line, with a blank line following it.

Not all implementations must support all formatters.  The user can supply their own formatters.  These are **reserved** names -- implementations should not use them to produce other formats.

### Simple Formatters ###

| {variable|html} | Escape the variable as HTML. |
|:----------------|:-----------------------------|
| {variable|html-attr-value} | Escape the variable as you would in an **attribute value** in an **HTML tag**, with " escaped as `&quot;`.  **alias**: `htmltag` |
| {variable|str}  | Convert the variable to a string (the exact representation is implementation dependent) |
| {variable|raw}  | Don't do anything to the variable |
| {node|json}     | Format the **node** as JSON (i.e. it could be a dictionary/list as well as an atom) |
| {variable|js-string} | Format the value as a JavaScript string (this actually a special case of `json`) |
| {variable|url-param-value} | Format the value so that it can be included as a **value** in a **url**, i.e. `http://example.com?name=*value*` |

### Formatters For Dictionaries ###

Formatters are often used on "leaf" values in the JSON tree, but they also work on dictionaries and lists.

The {pairs} formatter formats a dictionary so that its key and value are available as {@key} and {@value}.  See [testPairsFormatter](http://code.google.com/p/json-template/source/browse/jsontemplate_test.py#1174) in jsontemplate\_test.py for an example.

### Formatters with Arguments ###

Using the _more\_formatters_ callback mechanism, it's easy to create formatters which take arguments.

| {node|template-file relative/path.jsont} | Format the node (JSON subtree) using the template file at `relative/path.jsont`.  Everything after `template-file<space>` is part of a relative path.  The base directory is specified by the program (not the template).  The constructor arguments in that template should be specified as metadata in the first few lines (i.e. see `FromFile` in the Python implementation).  Again, this is not required of implementations, but it's a name reserved for the purpose of implementing this type of "include" mechanism. |
|:-----------------------------------------|:-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|

## Template Options ##

In the Python version, the arguments the `Template` constructor can be written in the template string itself.  To construct a `Template` instance from a string with such options, use `Template.FromString()` or `Template.FromFile()`.  Example:

```
meta: {{}}
default-formatter: html
format-char: :
<must have a blank line here>
This is the template, and now your variables should look like this:

{{.section foo}}
  {{bar:str}}
{{.end}}
```

And if the formatter str is left off, then the `html` formatter is used by default.

## API ##

JSON Template is intended to be **language-independent specification**.  This is why the Python tests run against both the Python and JavaScript implementations.  At a mininum, the internal API should consist of:

  * A `Template` class, which takes a template string in its constructor.
  * The `expand` method on the `Template` class, which takes a data dictionary and returns a string.

A free function `expand` is a one-liner from there, and is also useful.

The [Python API](http://chubot.org/json-template/epydoc/) includes more tools for processing template, including `FromFile`, `FromString`, and `CompileTemplate`.

See RecommendedApi for more details.

## Whitespace ##

The preferred mode of handling whitespace has the property that well-indented input produces well-indented output.  In other words, if anything except a **substitution** or **literal** (e.g. `{.space}`) appears on a line by itself, then all the whitespace from the line is omitted from the output.

Implementations of JSON Template **may** differ in whitespace, in recognition of the fact that this rule will lengthen the implementation (i.e. it's no longer sufficient to look at each token without context).  In this case, the tests should be relaxed (using the language-specific `verifier.py` shim).