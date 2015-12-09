  * Simple and readable **syntax**.  Template files are easily editable by non-programmers and people who won't know the language.
  * No need to learn another procedural language.  Use your programming language for logic, and JSON Template for strings.
  * **Extensible** with your own application-specific "formatters".
  * Comes with a default set of "formatters", so it's easy to get escaping/security right.
  * Generates any kind of textual content -- **readably**.  (A small amount of customizable syntax is allowed.)
  * **Secure** -- you may allow users to upload templates without compromising your application.  Many template languages use `eval()` to embed code, which makes this usage unsafe.
  * Has a well-defined, declarative, "data-oriented" API.  It uses JSON as the data model.
  * Has well-documented [patterns for template reuse](http://json-template.googlecode.com/svn/trunk/doc/On-Design-Minimalism.html).
  * The syntax is an "upgrade" of [Python 3](http://www.python.org/download/releases/3.0/) syntax.  Often I use Python's string formatting for simple web apps, since it offers simple named variable substitution.  If you set `format_char=':'`, then the syntax resembles [Python 3 advanced string formatting](http://www.python.org/dev/peps/pep-3101/), and you get a more powerful language with very little overhead.

  * It's designed to be **easily implemented**, and this has paid off with multiple user-contributed implementations in different languages.  Tokenization, parsing, compilation, and template expansion are all cleanly separated in the code.
  * A small implementation means you can use it in multiple contexts: at "build" time to generate static content, at runtime on the server, or on the client side (in JavaScript).  This is a library, not a framework.
  * Templates can be checked for validity **statically** -- that is, without an accompanying data dictionary.  For example, you could use this to create an SCM trigger to prevent invalid templates from being submitted.  See the `CompileTemplate` function in the Python implementation.
  * Easy to write ad hoc tools like search/replace tools, checks for correctness and style, a [syntax highlighter](http://json-template.googlecode.com/svn/trunk/python/highlight.py), maybe template security tools (for escaping), etc.

  * `[Python implementation]` It's Unicode agnostic.  You get correct Unicode behavior depending on the types of the inputs you pass in.