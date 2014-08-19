/*global process, require */

var fs = require("fs"),
    jst = require("jstranspiler"),
    when = require("when"),
    nodefn = require("when/node"),
    mkdirp = require("mkdirp"),
    path = require("path"),
    sweet = require("sweet.js");

var promised = {
    mkdirp: nodefn.lift(mkdirp),
    readFile: nodefn.lift(fs.readFile),
    writeFile: nodefn.lift(fs.writeFile)
  };

var args = jst.args(process.argv);
function processor(input, output) {

  var modules = ["/Users/iamwarry/Work/libs/sbt-sweet/macros.sjs"];

  return when.all(modules.map(function(mod) {
    return promised.readFile(mod, "utf8");
  })).then(function(modules) {
    return modules.map(function(mod, i) {
      try {
        var m = sweet.loadModule(mod);
      } catch(err) {
        throw parseError(modules[i], mod, err);
      }
      return m;
    })
  }).then(function(modules) {
    return promised.readFile(input, "utf8");

  }).then(function(contents) {
    var result = null;

    var options = {
      sourceMap: true,
      filename: input
    };

    try {
      var res = sweet.compile(contents, options);
    } catch(err) {
      throw parseError(input, contents, err);
    }
    return res;

  }).then(function(result) {
    return promised.mkdirp(path.dirname(output)).yield(result);

  }).then(function(result) {
    return promised.writeFile(output, result.code, "utf8").yield(result);

  }).then(function(result) {
    return {
      source: input,
      result: {
          filesRead: [input].concat(modules),
          filesWritten: [output]
      }
    };
  }).catch(function(e) {
    if (jst.isProblem(e)) return e; else throw e;
  });

}

jst.process({processor: processor, inExt: ".sjs", outExt: ".js"}, args);

/**
 * Utility to take a sweet error object and coerce it into a Problem object.
 */
function parseError(input, contents, err) {
  var lines = contents.split("\n");
  return {
    message: err.description,
    severity: "error",
    lineNumber: parseInt(err.lineNumber),
    characterOffset: err.column,
    lineContent: (err.lineNumber > 0 && lines.length >= err.lineNumber? lines[err.lineNumber - 1] : "Unknown line"),
    source: input
  };
}


