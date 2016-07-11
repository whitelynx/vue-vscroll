'use strict';
module.exports = function (grunt) {
    grunt.initConfig({
      "babel": {
        options: {
          sourceMap: true
        },
        dist: {
          files: {
            "dist/index.js": "src/index.js"
          }
        }
      }
    });

    grunt.loadNpmTasks('grunt-babel');

    grunt.registerTask("default", ["babel"]);
};
