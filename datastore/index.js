const fs = require('fs');
const path = require('path');
const _ = require('underscore');
const counter = require('./counter');
var items = {};
const Promise = require('bluebird');

var readFilePromisified = Promise.promisify(fs.readFile);

// Public API - Fix these CRUD functions ///////////////////////////////////////

exports.create = (text, callback) => {
  counter.getNextUniqueId((err, id) => {
    //NOTE: 1st Arg takes an file/file path. Also passing (err) => ... per documentation.
    var targetId = path.join(exports.dataDir, `/${id}.txt`);
    fs.writeFile(targetId, text, err => {
      if (err) {
        throw new Error('Create not run. Review text and callback inputs');
      }
      callback(null, { id: id, text: text });
    });
  });
};

exports.readOne = (id, callback) => {
  var targetId = path.join(exports.dataDir, `/${id}.txt`);
  fs.readFile(targetId, (err, data) => {
    if (err) {
      callback(new Error(`No item with id: ${id}`));
    } else {
      callback(null, { id: id, text: data.toString() });
    }
  });
};

exports.readAll = callback => {
  fs.readdir(exports.dataDir, (err, files) => {
    // var data = [];
    if (err) {
      throw new Error('readAll not running (i.e. directory not found)');
    }
    var data = _.map(files, file => {
      console.log(files, file);
      var id = path.basename(file, '.txt');
      var filePath = path.join(exports.dataDir, file);
      return readFilePromisified(filePath).then(text => {
        return { id: id, text: text.toString() };
      });
    });
    console.log(data);
    Promise.all(data).then(obj => {
      callback(null, obj);
    });
  });
};

exports.update = (id, text, callback) => {
  var targetId = path.join(exports.dataDir, `/${id}.txt`);
  fs.readFile(targetId, (err, data) => {
    if (err) {
      //NOTE: if readfile can't find the target file, return error
      // if the file is found, exercise fs.writefile
      callback(new Error(`No item with id: ${id}`));
    } else {
      //NOTE!!: else state above is required to prevent non-existent id from trickling down to fs.writefile.
      fs.writeFile(targetId, text, err => {
        if (err) {
          callback(new Error(`No item with id: ${id}`));
        } else {
          callback(null, { id: id, text: text });
        }
      });
    }
  });
};

exports.delete = (id, callback) => {
  fs.unlink(exports.dataDir + `/${id}.txt`, err => {
    if (err) {
      // report an error if item not found
      callback(new Error(`No item with id: ${id}`));
    } else {
      callback();
    }
  });
};

// Config+Initialization code -- DO NOT MODIFY /////////////////////////////////

exports.dataDir = path.join(__dirname, 'data');

exports.initialize = () => {
  if (!fs.existsSync(exports.dataDir)) {
    fs.mkdirSync(exports.dataDir);
  }
};
