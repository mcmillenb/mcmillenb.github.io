/**
* Created with mcmillenb.
* User: mcmillenb
* Date: 2015-06-21
* Time: 08:27 PM
*/

var http = require("http"), fs = require("fs");

var methods = Object.create(null);

// Returns a list of files when reading a directory and
// the file's content when reading a regular file.
methods.GET = function(path, respond){
  fs.stat(path, function(error, stats){
    if (error && error.code == "ENOENT")
      respond(404, "File not found");
    else if (error)
      respond(500, error.toString());
    else if (stats.isDirectory())
      fs.readdir(path, function(error, files){
        if (error)
          respond(500, error.toString());
        else 
          respond(200, files.join("\n"));
      });
    else
      respond(200, fs.createReadStream(path),
              require("mime").lookup(path));
  });
};

// code to handle delete requests
methods.DELETE = function(path, respond) {
  fs.stat(path, function(error, stats) {
    if (error && error.code == "ENOENT")
      respond(204);
    else if (error)
      respond(500, error.toString());
    else if (stats.isDirectory())
      fs.rmdir(path, respondErrorOrNothing(respond));
    else
      fs.unlink(path, respondErrorOrNothing(respond));
  });
};

// When an HTTP response does not contain any data, the
// status code 204 can be used to inicate "no content"
function respondErrorOrNothing(respond) {
  return function(error) {
    if (error)
      respond(500, error.toString());
    else
      respond(204);
  }
}

// attempts to create a write stream. will overwrite
// a file if it exists.
methods.PUT = function(path, respond, request) {
  var outStream = fs.createWriteStream(path);
  outStream.on("error", function(error) {
    respond(500, error.toString());
  });
  outStream.on("finish", function() {
    respond(204);
  });
  request.pipe(outStream);
};

// starts a server that returns 405 error responses 
// if the given method isn't handled by the server
http.createServer(function(request, response) {
  function respond(code, body, type) {
    if (!type) type = "text/plain";
    response.writeHead(code, {"Content-Type": type});
    if (body && body.pipe)
      body.pipe(response);
    else 
      response.end(body);
  }
  if (request.method in methods)
    methods[request.method](urlToPath(request.url),
                            respond, request);
  else
    respond(405, "Method " + request.method +
            " not allowed.");
}).listen(80, "mcmillenb.github.io");

// parses a given url
function urlToPath(url){
  var path = require("url").parse(url).pathname;
  return "." + decodeURIComponent(path);
}

