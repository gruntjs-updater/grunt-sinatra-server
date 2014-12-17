#!/usr/bin/env node 
var fs = require('fs');
var async = require('async');
var child_process = require('child_process');
var running = require("is-running");
var should = require("should");
var options = {//these match the Gruntfile
  debug : false,
  pidFile : "/tmp/sinatraServer.pid", 
  args : [],
  app_path : 'test/bin/hi.rb', 
};
var pid, grunt_watch_pid;
describe("start sinatra server", function(){
  this.timeout(10000);
  before(function(done){
    async.waterfall([
        function start_sinatra(start_callback){
          child_process.exec('grunt sinatra', { 'cwd' : './' }, function(err, stdout, stderr){
            start_callback(err, stdout, stderr);
          });
        },
        function check_errors(stdout, stderr){
          console.log(stdout, stderr);
          done();
        },
    ], function (err, result) {
         console.log(err);
         console.log(result);
       // result now equals 'done'    
    });
  });
  it("should start the server, and have an accessible pid file and pid", function(done){
    //code here
    async.waterfall([
        function read_pid(pid_callback){
          fs.readFile(options.pidFile, function(err, data){
            pid = parseInt(data.toString());
            running(pid).should.equal(true);
            pid_callback(null, pid);
            done();
          });
        },
      ], function (err, result) {
           console.log(err);
           console.log(result);
         // result now equals 'done'    
      });
   }); 
});
describe("kill sinatra server", function(){
  this.timeout(10000);
  before(function(done){
    async.waterfall([
        function kill_sinatra(kill_callback){
          child_process.exec('grunt sinatra:kill', { 'cwd' : './' }, function(err, stdout, stderr){
            kill_callback(err, stdout, stderr);
          });
        },
        function check_errors(stdout, stderr, check_error_callback){
          console.log(stdout, stderr);
          done();
        },
    ], function (err, result) {
         console.log(err);
         console.log(result);
       // result now equals 'done'    
    });
  });
  it("should be killed", function(done){
    async.waterfall([
        function check_pid(){
          var retries = 3;
          var delay = 1000;
          (function testSync(){
            try { 
             var test = process.kill(pid, 0);
             if (test && retries){
               retries--;
               setTimeout(testSync, delay);
             }
             throw('Could not determine if sinatra process was killed');
            }
            catch(err) { 
              (err.code).should.equal('ESRCH');
              return done();
            }
          })();
        },
      ], function (err, result) {
           console.log(err);
           console.log(result);
         // result now equals 'done'    
      });
  }); 
  it("should have no pid", function(done){
    async.waterfall([
        function test_pid_file(file_callback){
          fs.readFile(options.pidFile, function(err, data){
            (err.code).should.equal('ENOENT');
            return done();
          });
        },
     ], function (err, result) {
           console.log(err);
           console.log(result);
         // result now equals 'done'    
     });
   }); 
});

describe("start sinatra with grunt watch", function(){
  this.timeout(6000);
  before(function(done){
        var myproc = child_process.exec('grunt test-watch', { 'cwd' : './', stdio: 'pipe', detached: true }, function(err, stdout, stderr){
          if (options.debug) console.log(err);
        });
        grunt_watch_pid = myproc.pid;
        myproc.stderr.on('data', function(data){
          if (options.debug) console.log(data.toString());
        });
        myproc.stdout.on('data', function(data){
          if (options.debug) console.log(data.toString());
          ifww(data.toString().match(/(?:Listening)|(?:start: pid=\d+ port=\d+)/)){
            done();
          }
        });
  });
  it("should start the server, and have an accessible pid file and pid", function(done){
    //code here
    async.waterfall([
        function read_pid(pid_callback){
          fs.readFile(options.pidFile, function(err, data){
            pid = parseInt(data.toString());
            running(pid).should.equal(true);
            pid_callback(null, pid);
            done();
          });
        },
      ], function (err, result) {
           if (options.debug) console.log(err);
           if (options.debug) console.log(result);
         // result now equals 'done'    
      });
   }); 
   it('should have a new pid, after restarting when the watched file is modified', function(done){
    //code here
    async.waterfall([
        function read_data(read_callback){
          fs.readFile(options.app_path, function(err, data){
            var file_data = data.toString();
            var modification = file_data + "#";
            read_callback(null, modification);
          });
        },
        function write_new(modification, write_callback){
          if (options.debug) console.log(modification);
          fs.writeFile(options.app_path, modification, function(err){
            setTimeout(function(){ write_callback(null); }, 2000 ); //wait for server to reset
          });
        },
        function read_pid(pid_callback){
          fs.readFile(options.pidFile, function(err, data){
            var newpid = parseInt(data.toString());
            running(newpid).should.equal(true);
            pid_callback(null, newpid);
          });
        },
        function compare_pids(newpid){
          pid.should.not.equal(newpid);
          pid = newpid; 
          done();
        }
      ], function (err, result) {
           if (options.debug) console.log(err);
           if (options.debug) console.log(result);
         // result now equals 'done'    
      });
   }); 
});
describe("kill grunt watch server on interrupt", function(){
  this.timeout(6000);
  before(function(done){
    try { 
      var test = process.kill(grunt_watch_pid, 'SIGINT');
      setTimeout(done, 1500);
    }
    catch(err) { 
      throw(err);
    }
  });
  it("should be killed", function(done){
    async.waterfall([
        function check_pid(){
          var retries = 3;
          var delay = 1000;
          (function testSync(){
            try { 
             var test = process.kill(pid, 0);
             if (test && retries){
               retries--;
               setTimeout(testSync, delay);
             }
             throw('Could not determine if sinatra process was killed');
            }
            catch(err) { 
              (err.code).should.equal('ESRCH');
              return done();
            }
          })();
        },
      ], function (err, result) {
           if (options.debug) console.log(err);
           if (options.debug) console.log(result);
         // result now equals 'done'    
      });
  }); 
  it("should have no pid", function(done){
    async.waterfall([
        function delay(delay_callback){
          setTimeout(delay_callback, 1000);
        },
        function test_pid_file(){
          fs.readFile(options.pidFile, function(err, data){
            if (options.debug) console.log(err, data);
            (err.code).should.equal('ENOENT');
            return done();
          });
        },
     ], function (err, result) {
           if (options.debug) console.log(err);
           if (options.debug) console.log(result);
         // result now equals 'done'    
     });
   }); 
});
