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

  /**
   * リモートブランチリスト 最新のN件
   */
  MiniGit.prototype.latestBranches = function(count) {
    count = count || 10;
    var getCurrentBranch = new Promise(function(resolve, reject) {
      this.git._run(["rev-parse", "--abbrev-ref", "HEAD"], function(err, data) {
        if (err) {
          return reject(err);
        }
        resolve(data.replace(/\n/, ""));
      });
    }.bind(this));
    var getBranches = this.fetch().then(function() {
      return new Promise(function(resolve, reject) {
        this.git._run(["for-each-ref", "--sort=-committerdate", "--format=\"%(refname:short) %(subject)\"", "refs/remotes", "--count=" + count], function(err, data) {
          if (err) {
            return reject(err);
          }
          var list = data.split(/\n/).map(function(line) {
            if (/^\s*$/.test(line)) {
              return null;
            }
            var name, desc;
            var cols = line.split(/\s+/);
            name = cols.slice(0, 1).join(" ").replace(/"?origin\//, "");
            desc = cols.slice(1).join(" ");
            if (name === "HEAD") {
              return null;
            }
            return {
              name: name,
              description: desc,
              selected: false
            }
          }).filter(function(notNull) { return notNull; });
          resolve(list);
        });
      }.bind(this));
    }.bind(this));

    return Promise.all([
      getCurrentBranch,
      getBranches
    ]).spread(function(currentBranch, branches) {
      console.log(currentBranch);
      branches.forEach(function(record) {
        if (record.name !== currentBranch) {
          return;
        }
        record.selected = true;
      });
      return branches;
    });
  };

  return MiniGit;
})();