When writing JSON Template, and especially when doing the JavaScript port, I realized that it makes a good [Code Kata](http://codekata.pragprog.com/).  (OK that name is a little silly, but the concept is valid).

### Structure ###

This piece of code uses many programming fundamentals.  If you're learning a new language (as I was with JavaScript), then implementing JSON Template will be enlightening.

  * The template is **tokenized** using a **regular expression**.  (This makes it fast and saves a lot code size.  Note that this is **correct** due to the minimalistic design of the language.)
  * It uses nice object-oriented **encapsulation**.
  * For example, the `ProgramBuilder` class receives method calls from the parser, and uses an internal **stack** to build a **tree**.  (Python only; I didn't port this refactoring to the JavaScript version)
  * The `ScopedContext` class wraps a data dictionary and receives method calls from the compiled program, in order to change the block context (`PushSection`, `Pop` and `__iter__`).  It also has an internal **stack**.
  * The evaluator or "interpreter" uses **mutually recursive functions** to expand the template (`Execute` and family)
  * A user-defined **dictionary of functions** is used to specify the formatters (this will have different translations in different languages; in Python and JavaScript it's the same)
  * The JavaScript version uses **closures** instead of objects.  This was very delightful to discover.  Props to [Douglas Crockford](http://www.crockford.com/) for [showing us the light](http://javascript.crockford.com/little.html).  My mouth is agape that the [Rhino Book](http://oreilly.com/catalog/9780596000486/), touted as the definitive guide to JavaScript for the _decade_, has less than a page on closures, and it's presented as a _misfeature_ of JavaScript!  For shame.

All this in 500-ish lines, in a single file, with no dependencies!  I would like to see implementations in other languages; please send me patches (via http://codereview.appspot.com/)