# Introduction #

Template language compatibility is the most important thing, but consistent language-specific APIs are also desirable.  Every language has specific idioms, so of course they can be adapted.

## Internal representation of "JSON" ##

As mentioned in [issue 41](https://code.google.com/p/json-template/issues/detail?id=41), an implementation can use "structs" (compile time constructs) as the "data dictionary".

This may be more appropriate in compiled languages, which do not have "native" representations of JSON as Python and JavaScript do.

# API #

The following is rough pseudo-code.  Please see the canonical Python and JavaScript implementations for details.

## Creating Templates ##

```
template = jsontemplate.Template("Hello {name}", options);
string = template.expand({"name": "World"});  # Hello World
```

Templates can also be construct with leading metadata using the `fromString` function:

```
template = jsontemplate.fromString("meta: {%%}\n\nHello {%name%}");
string = template.expand({"name": "World"});  # Hello World
```

A `fromFile` function is also appropriate.  This may be useful to implement template "includes" as formatters.

# FunctionRegistry API #

A `FunctionRegistry` is used to look up **formatters** and **predicates**.

> `registry.lookup(user_str) --> [func, args]`, returns undefined if no matching formatter is found

`user_str` can be a simple formatter like 'html', or a formatter with arguments like 'template-file user-profile.jsont'.

`func` is a function, and `args` is an object that should pe passed to `func`.

`ScopedContext` API:

> `context.get(json_key) --> <JSON value>`, can raise `UndefinedVariable`
if `undefined_str` is not set

This API is used when writing custom formatters and predicates.

The context maintains and **internal cursor**.  At any point, you can **get** a value relative to the cursor.