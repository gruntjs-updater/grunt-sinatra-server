# grunt-sinatra-server

> Use grunt to control Sinatra's development server, and live-reload with grunt-contrib-watch! 


## The "sinatra" task

### Overview
####sinatra:start (the default sinatra task)
Launches the server and leaves it running even when the parent process is no longer running.

####sinatra:stop --or-- sinatra:kill
Terminates an already running server.

###Options
The `sinatra` task should be configured with the following options:

| Name | Type | Default  | Description                                               |
| -----| ---- | -------- | ----------------------------------------------------------|
| pidFile | `string` | `'/tmp/sinatraServer.pid'` | Path to the pid file. (REQUIRED) |
| debug | `boolean` | `false` | Extra logging output (OPTIONAL)                      |
| args | `array` | `[]` | Additional arguments to add to the sinatra command, supplied as an array of strings. (OPTIONAL) |



### Getting Started
In the shell...
```shell
npm install grunt-sinatra-server
```

Load it by adding this to Gruntfile.js:

```js
grunt.loadNpmTasks('grunt-sinatra-server');
```
Then add `sinatra` to the taskList object passed into `grunt.registerTask` in Gruntfile.js.
(example:)
```js
	grunt.registerTask('default', [
		'concat',
		'uglify',
		'sinatra',
		'watch'
	]);
```

##Running tests
To run the test suite, first invoke the following command within the repo, installing the development dependencies:
```shell
$ npm install
```
Then run the tests:
```shell
$ mocha test/test.js
```

##With grunt-contrib-watch:

You can use this plugin with watch. This is awesome because it enables you to live reload the sinatra server when you make changes to server files (or really, any files that you specify). Here's an example of my watch config:

```   
    watch: {
      sinatra: {
        options: {
          spawn : false, // IMPORTANT. will not work without this setting.
        },
        files: [
          '/bin/hi.rb'
        ],
        tasks: ['sinatra'] 
      }
    },
 
//...
  grunt.registerTask('default', ['sinatra', 'watch']);
```
The sinatra task knows if watch is running, and on interrupt will kill the sinatra server along with it.

