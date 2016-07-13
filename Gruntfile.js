'use strict';
module.exports = function(grunt)
{
    grunt.initConfig({
        project: {
            source: 'src/index.js',
            example: 'index.html',
            output: 'dist/index.js'
        },
        "babel": {
            options: {
                sourceMap: true
            },
            library: {
                src: ['<%= project.source %>'],
                dest: '<%= project.output %>'
            }
        },
        eslint: {
            all: ['<%= project.source %>', '<%= project.example %>']
        }
    });

    grunt.loadNpmTasks('grunt-babel');
    grunt.loadNpmTasks('gruntify-eslint');

    grunt.registerTask("default", ['eslint', 'babel']);
};
