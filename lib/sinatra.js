'use strict';

var spawn = require('child_process').spawn,
       fs = require('fs'),
   mkdirp = require('mkdirp'),
     path = require('path');

var DELAY = 1000;
var RETRIES = 3;

var _currentProcess;
var pid;

module.exports.start = function(grunt, options, callback) {
  var that = this;
  //see if pid file exists
  fs.readFile(options.pidFile, function(err, data){
    //see if sinatra is running
    if(data){
      var _pid = data.toString();
      if (! _pid){
        grunt.log.error(('Sinatra pid file ' + options.pidFile + 'exists in filesystem, but is empty.').red);
        grunt.log.error(('Please remove ' + options.pidFile + ' to continue.').red);
        process.exit(1);
      }
      var retries = RETRIES;
      (function recursiveSync(){
        try{
          if(process.kill(_pid, 0)){
            grunt.log.error('Sinatra appears to be running already. Try killing it with:'.red);
            grunt.log.error('grunt sinatra:kill'.yellow);
            process.exit(1);
          }
          retries--;
          if (options.debug){ grunt.log.error('Checking if sinatra service is already running'.yellow); }
          setTimeout(recursiveSync, DELAY);
        }
        catch(err){
          grunt.log.error('Sinatra pid file exists in filesystem.'.red);
          grunt.log.error(('Please remove '+options.pidFile+' to continue.').red);
          process.exit(1);
        }
      })();
      grunt.log.error(('Sinatra process' + pid + ' may not be running. If it is, try killing it manually and restarting.').red);
      return process.exit(1);
    }
    else if (err.code === 'ENOENT'){
      _currentProcess = grunt.util.spawn({
        cmd:      'ruby',
        args:     [options.app_path].concat(options.args),
        env:      process.env,
        fallback: function() { /* Prevent EADDRINUSE from breaking Grunt */ },
        opts: { 
          stdio : 'pipe', 
          detached : true,
        },
      }, function(){ 
          grunt.log.error('Sinatra process exited'.red);
          callback();
      });
      _currentProcess.stdout.on('data', function(data){
        grunt.log.writeln(('Sinatra:' + data.toString()).grey);
        if(data.toString().match(/.+/)){
          if (! process._sinatra_session){
            process.exit();
          } 
        }
      });
      _currentProcess.stderr.on('data', function(data){
        grunt.log.writeln(('Sinatra Stderr:' + data.toString()).grey);
        if(data.toString().match(/Sinatra.*has taken the/)){
          mkdirp(path.dirname(options.pidFile), function (err){
            if(err){ 
              grunt.log.error('Could not create pidfile for sinatra:'.red);
              grunt.log.error(err.red);
              _currentProcess.kill();
              process.exit(1);
            }
          });
          fs.writeFile(options.pidFile, _currentProcess.pid, function(err){
            if (err) {
              grunt.log.error(('Could not write to pidFile'+options.pidFile+':').red);
              grunt.log.error(err.red);
              process.exit(1);
            }
            process.once('SIGINT', function(){ //sigint should kill the process
              that.kill(grunt, options, function(){
                process.exit(); 
              });
            });
            //probably remove
            if (! process._sinatra_session){
              return callback();
            } 
            callback();
          });
        }
      });
    }else{
      grunt.error.log(('Problem accessing sinatra pid file '+options.pidFile+'.').red);
      grunt.error.log(('Error: '+error.code).red);
      process.exit(1);
    }
  })
};

module.exports.kill = function(grunt, options, callback){
  //hack to combine all commands into just start and kill
  if (process._sinatra_session && typeof(_currentProcess === 'undefined') && ! grunt.file.exists(options.pidFile)){
    return callback();
  }
  function _syncKill(pid, callback){
    if(options.debug) { grunt.log.error(('Sending kill signal to process: ' + pid).yellow)};
    process.kill(pid, 'SIGKILL');
    var retries = RETRIES;
    (function recursiveSync(){
      try{
         if(process.kill(pid, 0)){
           if (! retries){
             grunt.log.error(('Unable to kill process ' + pid + ' between starts. Trying increasing delay length?').red);
             callback();
           }
           retries--;
           if (options.debug){ grunt.log.error('Checking if sinatra server was killed successfully'.yellow); }
           setTimeout(recursiveSync, DELAY);
         }
      }
      catch(err){
        //sometimes process exits before error
      }
      _currentProcess = undefined;
      fs.unlink(options.pidFile, function(){ 
        callback() 
      });
    })();
  }

  if (typeof(_currentProcess) !== 'undefined' && typeof(_currentProcess.pid) === 'number'){
    return _syncKill(_currentProcess.pid, callback)
  };
  fs.readFile(options.pidFile, function(err, data){
    if (err || data === 'undefined'){
      grunt.log.error('Could not read '.red + options.pidFile.red);
      grunt.log.error('If sinatra is running, please kill it manually.'.red);
      process.exit(1);
    }
    _syncKill(data.toString(), callback);// otherwise it's a buffer
  });
};
