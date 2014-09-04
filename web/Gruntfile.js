module.exports = function(grunt) {
    var scripts = []; 
    var styles = [];
    // add here the scripts included out of <!-- build:js app.js --> container (in index.html)
    var scriptFilter = [
      'lib/es5-shim/es5-shim.js',
      'lib/json3/json3.min.js',
      'lib/tinymce/tinymce.min.js',
      'lib/ace/ace.js'
    ];
    var isToProcess = function(regex, script){
        return !(regex.test(script));
    }
    // encoding for reading files
    grunt.file.defaultEncoding = 'utf8';
    grunt.initConfig({
      pkg: grunt.file.readJSON('package.json'),
      // clean the build before start
      clean: ["build"],
      // usemin: remove all js scripts inclusion  and replace them with  
      // concatenated "app.js" script inclusion in index.html
      useminPrepare: {
        html: 'app/index.html',
        options: {
          dest: 'build'
        }
      },
      usemin: {
        html: ['build/index.html'],
      },
      // copy scripts
      copy:{
        // copy ace editor scripts
        ace:{
          expand: true,
          flatten: false,
          cwd: 'app/lib/ace',
          src: '**/*',
          dest: 'build/lib/ace'
        }, 
        // copy tinymce scripts
        tinymce:{
          expand: true,
          flatten: false,
          cwd: 'app/lib/tinymce',
          src: '**/*',
          dest: 'build/lib/tinymce'
        },
        // copy zero clipboard flash element
        zclip:{
          expand: true,
          flatten: false,
          cwd: 'app/lib/zclip',
          src: '**/*',
          dest: 'build/lib/zclip'
        },
        // copy index file 
        index:{
          src: 'app/index.html',
          dest: 'build/index.html'
        },
        // copy angularjs views 
        views:{
          expand: true,
          flatten: false,
          cwd: 'app/',
          src: 'modules/**/*.html',
          dest: 'build/',
          rename: function(dest, src){
            return dest  + src;
          }
        },
        //copy styles
        style:{
           expand: true,
           flatten: false,
           cwd: 'app/styles/',
           src: '**/*',
           dest: 'build/styles/',
           filter: function(filepath){
            var stylesFilterRegEx = new RegExp( '\\b' + styles.join('\\b|\\b') + '\\b') ;
            return isToProcess(stylesFilterRegEx, filepath);
           }
        },
        // copy images
        img:{
          expand: true,
          flatten: false,
          cwd: 'app/img/',
          src: '**/*',
          dest: 'build/img'
        },
        // copy favicon
        favicon: {
          expand: true,
          cwd: 'app/',
          src: 'favicon.ico',
          dest: 'build/favicon.ico'
        }
      },
      // concat js scripts ( the list of scripts is generated by findIndexScripts task)
      concat: {
        js: {
          dest:'build/app.js',
          src: scripts
        },
        css: {
          dest: 'build/styles/main.css',
          src: styles
        }
      }//,
      //uglify scripts
     //  uglify: {
     //    build: {
     //      files: {
     //        'build/app.js': ['build/app.js']
     //      }
     //    }
     //  }
    });
    // load npm modules
    grunt.loadNpmTasks('grunt-usemin');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-concat');  
    grunt.loadNpmTasks('grunt-contrib-clean');
    //grunt.loadNpmTasks('grunt-contrib-uglify');
    // task to get all js inclusion from index.html
    grunt.registerTask('findIndexScripts', function() {
        var scriptFilterRegEx = new RegExp( '\\b' + scriptFilter.join('\\b|\\b') + '\\b') ;
        var matched = grunt.file.read('app/index.html').match(/<(.*?)script\b[^>]*>([\s\S]*?)<[^\/]*\/script[^>]*>/gi);        
        for(var i = 0; i < matched.length; i++)   
          if(isToProcess(scriptFilterRegEx, matched[i]))
            scripts.push('app/' + matched[i].split('"')[1]);        
    });
    // task to get all css from main.css file
    grunt.registerTask('findCustomStyles', function() {        
        var matched = grunt.file.read('app/styles/main.css').match(/@import url\('([\s\S]*?)'\);/gi);        
        for(var i = 0; i < matched.length; i++) 
          styles.push('app/styles/' + matched[i].split("'")[1]);        
    });
    // build task
    grunt.registerTask('build', ['clean','findCustomStyles', 'findIndexScripts', 'copy:index', 'copy:ace', 'copy:tinymce','copy:zclip', 'copy:views','copy:img','copy:style','copy:favicon', 'useminPrepare','usemin','concat:js', 'concat:css']);
    grunt.registerTask('default', ['build']);
};

