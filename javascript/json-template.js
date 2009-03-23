// Copyright (C) 2009 Andy Chu
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// $Id$

//
// JavaScript implementation of json-template.
//

// TODO: Need some kind of module system

// Regex escaping for common metacharacters (note that JavaScript needs 2 \\ --
// no raw strings!
var META_ESCAPE = {
  '{': '\\{',
  '}': '\\}',
  '{{': '\\{\\{',
  '}}': '\\}\\}',
  '[': '\\[',
  ']': '\\]'
};

function _MakeTokenRegex(meta_left, meta_right) {
  // TODO: check errors
  return new RegExp(
      '(' +
      META_ESCAPE[meta_left] +
      '.+?' +
      META_ESCAPE[meta_right] +
      '\n?)');
}

// 
// Formatters
//

function HtmlEscape(s) {
  return s.replace(/&/g,'&amp;').                                         
           replace(/>/g,'&gt;').                                           
           replace(/</g,'&lt;');
}

function HtmlTagEscape(s) {
  return s.replace(/&/g,'&amp;').                                         
           replace(/>/g,'&gt;').                                           
           replace(/</g,'&lt;').                                           
           replace(/"/g,'&quot;');
}

// Default ToString can be changed
function ToString(s) {
  return s;
}

var DEFAULT_FORMATTERS = {
  'html': HtmlEscape,
  'htmltag': HtmlTagEscape,
  'str': ToString,
  'raw': function(x) {return x;}
};


//
// Template implementation
//

function _ScopedContext(context) {
  var stack = [context];
  // iteration index for next().  -1 means we're NOT iterating.
  var index = -1;  

  return {
    PushSection: function(name) {
      log('PushSection '+name);
      if (name === undefined || name === null) {
        return null;
      }
      var new_context = stack[stack.length-1][name] || null;
      stack.push(new_context);
      return new_context;
    },

    Pop: function() {
      stack.pop();
    },

    next: function() {
      // Now we're iterating -- push a dummy context
      if (index == -1) {
        stack.push(null);
        index = 0;
      }

      // The thing we're iterating voer
      var context_array = stack[stack.length - 2];

      // We're already done
      if (index == context_array.length) {
        stack.pop();
        index = -1;  // No longer iterating
        log('next: null');
        return null;  // sentinel to say that we're done
      }

      log('next: ' + index);

      stack[stack.length - 1] = context_array[index++];

      log('next: true');
      return true;  // OK, we mutated the stack
    },

    CursorValue: function() {
      return stack[stack.length - 1];
    },

    Lookup: function(name) {
      var i = stack.length - 1;
      while (true) {
        var context = stack[i];
        log('context '+repr(context));

        if (typeof context !== 'object') {
          i--;
        } else {
          var value = context[name];
          if (value === undefined || value === null) {
            i--;
          } else {
            return value;
          }
        }
        if (i <= -1) {
          throw {name: 'UndefinedVariable', message: name + ' is not defined'};
        }
      }
    }
  };
}


function _Section(section_name) {
  var current_clause = [];
  var statements = {'default': current_clause};

  return {
    section_name: section_name, // public attribute

    Statements: function(clause) {
      clause = clause || 'default';
      return statements[clause] || [];
    },

    NewClause: function(clause_name) {
      var new_clause = [];
      statements[clause_name] = new_clause;
      current_clause = new_clause;
    },

    Append: function(statement) {
      current_clause.push(statement);
    }
  };
}


function _Execute(statements, context, callback) {
  var i;
  for (i=0; i<statements.length; i++) {
    statement = statements[i];

    //log('Executing ' + statement);

    if (typeof(statement) == 'string') {
      callback(statement);
    } else {
      var func = statement[0];
      var args = statement[1];
      func(args, context, callback);
    }
  }
}


function _DoSubstitute(statement, context, callback) {
  log('Substituting: '+ statement.name);
  var value;
  if (statement.name == '@') {
    value = context.CursorValue();
  } else {
    value = context.Lookup(statement.name);
  }

  // Format values
  for (i=0; i<statement.formatters.length; i++) {
    value = statement.formatters[i](value);
  }

  callback(value);
}


// for [section foo]
function _DoSection(args, context, callback) {

  var block = args;
  var value = context.PushSection(block.section_name);
  var do_section = false;

  // "truthy" values should have their sections executed.
  if (value) {
    do_section = true;
  }
  // Except: if the value is a zero-length array (which is "truthy")
  if (value && value.length === 0) {
    do_section = false;
  }

  if (do_section) {
    _Execute(block.Statements(), context, callback);
    context.Pop();
  } else {  // Empty list, None, False, etc.
    context.Pop();
    _Execute(block.Statements('or'), context, callback);
  }
}



function _DoRepeatedSection(args, context, callback) {
  var block = args;
  var pushed;

  if (block.section_name == '@') {
    // If the name is @, we stay in the enclosing context, but assume it's a
    // list, and repeat this block many times.
    items = context.CursorValue();
    // TODO: check that items is an array; apparently this is hard in JavaScript
    //if type(items) is not list:
    //  raise EvaluationError('Expected a list; got %s' % type(items))
    pushed = false;
  } else {
    items = context.PushSection(block.section_name);
    pushed = true;
  }

  //log('ITEMS: '+showArray(items));
  if (items && items.length > 0) {
    // Execute the statements in the block for every item in the list.
    // Execute the alternate block on every iteration except the last.  Each
    // item could be an atom (string, integer, etc.) or a dictionary.
    
    var last_index = items.length - 1;
    var statements = block.Statements();
    var alt_statements = block.Statements('alternate');

    for (var i=0; context.next() !== null; i++) {
      log('_DoRepeatedSection i: ' +i);
      _Execute(statements, context, callback);
      if (i != last_index) {
        log('ALTERNATE');
        _Execute(alt_statements, context, callback);
      }
    }
  } else {
    log('OR: '+block.Statements('or'));
    _Execute(block.Statements('or'), context, callback);
  }

  if (pushed) {
    context.Pop();
  }
}


var _SECTION_RE = /(repeated)?\s*(section)\s+(\S+)?/;


// TODO: The compile function could be in a different module, in case we want to
// compile on the server side.
function _Compile(template_str, options) {
  var more_formatters = options.more_formatters || {};

  // We want to allow an explicit null value for default_formatter, which means
  // that an error is raised if no formatter is specified.
  if (options.default_formatter === undefined) {
    var default_formatter = 'str'; 
  } else {
    var default_formatter = options.default_formatter;
  }

  function GetFormatter(format_str) {
    var formatter = more_formatters[format_str] ||
                    DEFAULT_FORMATTERS[format_str];
    if (formatter === undefined) {
      throw {
        name: 'BadFormatter',
        message: format_str + ' is not a valid formatter'
      };
    }
    return formatter;
  }

  var format_char = options.format_char || '|';
  if (format_char != ':' && format_char != '|') {
    throw {
      name: 'ConfigurationError',
      message: 'Only format characters : and | are accepted'
    };
  }

  var meta = options.meta || '{}';
  var n = meta.length;
  if (n % 2 == 1) {
    throw {
      name: 'ConfigurationError',
      message: meta + ' has an odd number of metacharacters'
    };
  }
  var meta_left = meta.substring(0, n/2);
  var meta_right = meta.substring(n/2, n);

  var token_re = _MakeTokenRegex(meta_left, meta_right);
  var tokens = template_str.split(token_re);
  var current_block = _Section();
  var stack = [current_block];

  var strip_num = meta_left.length;  // assume they're the same length

  for (var i = 0; i < tokens.length; i++) {
    var token = tokens[i];
    var interpret_token = (i % 2 == 1);

    log('i: '+i);
    log('token0: "'+ token+'"');

    if (interpret_token) {
      var had_newline = false;
      if (token.slice(-1) == '\n') {
        token = token.slice(null, -1);
        had_newline = true;
      }

      token = token.substr(0 + strip_num, token.length - 1 - strip_num);
      log('token2: "'+ token+'"');

      if (token[0] == '#') {
        continue;  // comment
      }

      if (token[0] == '.') {  // Keyword
        token = token.substring(1, token.length);
        log('token3: "'+ token+'"');

        var literal = {
            'meta-left': meta_left,
            'meta-right': meta_right,
            'space': ' ',
            }[token];

        if (literal !== undefined) {
          current_block.Append(literal);
          continue;
        }

        var match = token.match(_SECTION_RE);

        if (match) {
          var repeated = match[1];
          var section_name = match[3];
          var func = repeated ? _DoRepeatedSection : _DoSection;
          log('repeated ' + repeated + ' section_name ' + section_name);

          var new_block = _Section(section_name);
          current_block.Append([func, new_block]);
          stack.push(new_block);
          current_block = new_block;
          continue;
        }

        if (token == 'alternates with') {
          current_block.NewClause('alternate');
          continue;
        }

        if (token == 'or') {
          current_block.NewClause('or');
          continue;
        }

        if (token == 'end') {
          // End the block
          stack.pop();
          if (stack.length > 0) {
            current_block = stack[stack.length-1];
            //log('STACK '+showArray(stack));
            //log('end BLOCK '+showArray(current_block.Statements()));
          } else {
            throw {
              name: 'TemplateSyntaxError',
              message: 'Got too many {end} statements'
            };
          }
          continue;
        }
      }

      // A variable substitution
      var parts = token.split(format_char);
      var formatters;
      var name;
      if (parts.length == 1) {
        if (default_formatter === null) {
            throw {
              name: 'MissingFormatter',
              message: 'This template requires explicit formatters.'
            };
        }
        // If no formatter is specified, the default is the 'str' formatter,
        // which the user can define however they desire.
        formatters = [GetFormatter(default_formatter)];
        name = token;
      } else {
        formatters = [];
        for (var j=1; j<parts.length; j++) {
          formatters.push(GetFormatter(parts[j]));
        }
        name = parts[0];
      }
      current_block.Append(
          [_DoSubstitute, { name: name, formatters: formatters}]);
      if (had_newline) {
        current_block.Append('\n');
      }

    } else {
      if (token) {
        current_block.Append(token);
      }
    }
  }

  if (stack.length !== 1) {
    throw {
      name: 'TemplateSyntaxError',
      message: 'Got too few {end} statements'
    };
  }
  return current_block;
}


function Template(template_str, options) {
  var program = _Compile(template_str, options || {});

  return  {
    render: function(data_dict, callback) {
      log('rendering ' + repr(data_dict));
      //log('statements ' + program.Statements());
      _Execute(program.Statements(), _ScopedContext(data_dict), callback);
    },

    expand: function(data_dict) {
      var tokens = [];
      this.render(data_dict, function(x) { tokens.push(x); });
      return tokens.join('');
    }
  };
}
