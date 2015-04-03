function parseExpression(program){
    /// Returns an object containing the data structure for the
    /// expression at the start of the string, along with the part
    /// of the string left after parsing this expression.
    var match, expr;

    program = skipSpace(program); // skip leading spaces
    
    // try to match one of the three atomic elements
    if (match = /^"([^"]*)"/.exec(program)) // string
        expr = {type: "value", value: match[1]};
    else if (match = /^\d+\b/.exec(program)) // number
        expr = {type: "value", value: Number(match[0])};
    else if (match = /^[^\s(),"]+/.exec(program)) // word
        expr = {type: "word", name: match[0]};
    else
        throw new SyntaxError("Unexpected syntax: " + program);
    
    return parseApply(expr, program.slice(match[0].length));
}

function skipSpace(string) {
    /// cuts off any whitespace at the beginning of a given string
    var first = string.search(/\S/);
    if (first == -1) return "";
    return string.slice(first);
}

function parseApply(expr, program){
    /// Checks whether a given expression is an application. If so,
    /// parses a parenthesized list of arguments.
    program = skipSpace(program);
    if (program[0] !="(") // if next char isn't "(", then not an application
        return {expr: expr, rest: program};
        
    program = skipSpace(program.slice(1)); // skip the "("
    expr = {type: "apply", operator: expr, args: []};
    while (program[0] != ")"){
        var arg = parseExpression(program);
        expr.args.push(arg.expr);
        program = skipSpace(arg.rest);
        if (program[0] == ",")
            program = skipSpace(program.slice(1));
        else if (program[0] != ")")
            throw new SyntaxError("Expected ',' or ')'");
    }
    return parseApply(expr, program.slice(1));
}

function parse(program) {
    /// Reads in a program from an input string and returns the 
    /// program's data structure.
    var result = parseExpression(program); 
    if (skipSpace(result.rest).length > 0)
        throw new SyntaxError("Unexpected text after program");
    return result.expr;
}

function evaluate(expr, env) {
    /// Given a syntax tree (expr) and an environment object (env), 
    /// evaluates the expression that the tree represents and returns
    /// the value that this produces
    switch(expr.type) {
        case "value":   // a literal value expression just returns its value
            return expr.value;
        
        case "word":    // a variable
            if (expr.name in env) // check whether it is defined in the environment
                return env[expr.name]; // return the variable's value
            else
                throw new ReferenceError("Undefined variable: " + expr.name);
        
        case "apply":   // an application           // if this is a special form, pass the
            if (expr.operator.type == "word" &&     // argument expression and environment to
                expr.operator.name in specialForms) // the function that handles this form
                return specialForms[expr.operator.name](expr.args, env);
            
            var op = evaluate(expr.operator, env);  // if this is a normal call
            if (typeof op != "function")            
                throw new TypeError("Applying a non-function.");
            return op.apply(null, expr.args.map(function(arg) { // evaluate the operator, verify 
                return evaluate(arg, env);                      // it's a function, and call the 
            }));                                                // result of evaluating the args
    }
}

var specialForms = Object.create(null);

specialForms["if"] = function (args, env) {
    if (args.length != 3)   // if construct expects exactly three args
        throw new SyntaxError("Bad number of args to if");
    
    if (evaluate(args[0], env) !== false)
        return evaluate(args[1], env);  // return 2nd arg if 1st isn't false
    else
        return evaluate(args[2], env);  // otherwise return 3rd arg
}

specialForms["while"] = function (args, env) {
    if (args.length != 2)
        throw new SyntaxError("Bad number of args to while");
        
    while (evaluate(args[0], env) !== false)    // while 1st arg is true
        evaluate(args[1], env);                 // evaluate the 2nd
        
    return false; // since undefined does not exist in Egg language
}

specialForms["do"] = function (args, env) {
    /// executes all of its args from top to bottom
    var value = false;
    args.forEach(function(arg) {
        value = evaluate(arg, env);
    });
    return value;
}

specialForms["define"] = function (args, env) {
    /// Expects a word as its 1st arg and an expression producing
    /// the value to assign to that word as its 2nd arg
    if (args.length !=2 || args[0].type != "word")
        throw new SyntaxError("Bad use of define");
    var value = evaluate(args[1], env);
    env[args[0].name] = value;
    return value;
}

specialForms["fun"] = function(args, env){
    if (!args.length)
        throw new SyntaxError("Functions need a body");
    function name(expr) {
        if (expr.type != "word")
            throw new SyntaxError("Arg names must be words");
        return expr.name;
    }
    
    // treats its last arg as the function's body and treats all the args
    // before that as the names of the function's arguments
    var argNames = args.slice(0, args.length - 1).map(name);
    var body = args[args.length - 1];
    
    return function() {
        if (arguments.length != argNames.length)
            throw new TypeError("Wrong number of arguments");
            
        // make a new object that has access to the variables in the outer
        // environment (its prototype) but that can also contain new variables
        // without modifying that outer scope
        var localEnv = Object.create(env);
        
        for (var i = 0; i < arguments.length; i++)
            // adds the argument variables to the local environment
            localEnv[argNames[i]] = arguments[i]; 
            
        return evaluate(body, localEnv);
    };
};

// Create the environment
var topEnv = Object.create(null);

// Bind the two Boolean values
topEnv["true"] = true;
topEnv["false"] = false;

// Synthesize a bunch of operator functions
["+", "-", "*", "/", "==", "<", ">"].forEach(function(op) {
    topEnv[op] = new Function("a, b", "return a " + op + "b;");
});

// way to output values
topEnv["print"] = function(value){
    console.log(value);
    //using this for testing
    document.getElementById("test").appendChild(document.createTextNode(value+" "));
    return value;
}

function run() {
    var env = Object.create(topEnv);
    
    // Trick to turn an array-like object, such as arguments, into a real array 
    // so that we can call join on it. Takes all the arguments given to run and 
    // treats them as lines of a program.
    var program = Array.prototype.slice.call(arguments, 0).join("\n"); 
    
    return evaluate(parse(program), env);
}

run("do(define(total, 0),",
    "   define(count, 1),",
    "   while(<(count, 11),",
    "         do(define(total, +(total, count)),",
    "            define(count, +(count, 1)))),",
    "   print(total))");
// -> 55

run("do(define(plusOne, fun(a, +(a, 1))),",
    "   print(plusOne(10)))");
// -> 11

run("do(define(pow, fun(base, exp,",
    "     if(==(exp, 0),",
    "        1,",
    "        *(base, pow(base, -(exp, 1)))))),",
    "   print(pow(2, 10)))");
// -> 1024