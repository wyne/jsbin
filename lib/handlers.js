var async = require('asyncjs'),
    path  = require('path');

// Create a not found error handler.
function NotFound() {
  Error.apply(this, arguments);
}
NotFound.prototype = Object.create(Error.prototype);

module.exports = function (app) {
  var handlers = {
    getDefault: function (req, res) {
      handlers.renderFiles(req, res);
    },
    getBin: function (req, res, next) {
      handlers.render(req, res, req.bin);
    },
    getBinPreview: function (req, res) {
      res.send('bin: ' + req.bin.id);
    },
    notFound: function (req, res) {
      var files = handlers.defaultFiles();
      files[2] = 'not_found.js';
      handlers.renderFiles(req, res, files);
    },
    loadBin: function (req, res, next) {
      var rev = parseInt(req.params.rev, 10) || 1,
          query = {id: req.params.bin, revision: rev};

      app.store.getBin(query, function (err, result) {
        if (err) {
          return next(new NotFound('Could not find bin: ' + req.params.bin));
        } else {
          req.bin = result;
          next();
        }
      });
    },
    render: function (req, res, bin) {
      var template = {
        css: bin.css || '',
        html: bin.html || '',
        javascript: bin.javascript || ''
      };

      // Very temporary render for the index file.
      res.render('index', {
        tips: '{}',
        revision: bin.revision || 1,
        json_template: JSON.stringify(template),
        version: app.set('environment') === 'production' ? app.set('version') : 'debug'
      });
    },
    renderFiles: function (req, res, files) {
      files = files || handlers.defaultFiles();
      async.files(files, app.set('views')).readFile("utf8").toArray(function (err, results) {
        if (!err) {
          handlers.render(req, res, {
            html: results[0].data,
            css: results[1].data,
            javascript: results[2].data
          });
        }
      });
    },
    defaultFiles: function () {
      return ['html', 'css', 'js'].map(function (ext) {
        return 'default.' + ext;
      });
    },
    NotFound: NotFound
  };
  return handlers;
};