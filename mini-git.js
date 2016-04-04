module.exports = (function() {
  var Promise = require("bluebird");
  var MiniGit = function(workingDirPath) {
    this.wd = workingDirPath;
    this.git = require("simple-git")(workingDirPath);
  };

  /**
   * git fetch
   * @method fetch
   *
   */
  MiniGit.prototype.fetch = function() {
    return new Promise(function(resolve, reject) {
      return this.git._run(["fetch", "-p"], function(err, data) {
        if (err) {return reject(err)}
        console.log(this.wd + ": fetch done");
        return resolve(this);
      }.bind(this));
    }.bind(this));
  };
  /**
   * ブランチ変更 & 追従
   * @method checkout
   *
   */
  MiniGit.prototype.checkout = function(branchName) {
    return new Promise(function(resolve, reject) {
      this.git._run(["checkout", branchName], function(err, data) {
        if (err) {return reject(err)}
        console.log(this.wd + ": checkout: " + branchName);
        return resolve();
      }.bind(this))
    }.bind(this)).then(function() {
      return new Promise(function(resolve, reject) {
        this.git._run(["merge", "origin/" + branchName], function(err, data) {
          if (err) {return reject(err)}
          console.log(this.wd + ": merge origin: " + branchName);
          resolve(this);
        }.bind(this));
      }.bind(this));
    }.bind(this));
  };

  return MiniGit;
})();