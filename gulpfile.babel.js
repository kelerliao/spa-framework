'use strict';

import gulp          from 'gulp';
import del           from 'del';
import { spawn }     from 'child_process';
import requireDir    from 'require-dir';

requireDir('./gulp-task');

/*
 * clean handler
 * clean file and folder
 **/
gulp.task('clean', cb => {
    console.log('clean run...');
    return del(['development/*','!development/img', 'production/*','!production/img'], cb);
});

/*
 * watch handler
 **/
gulp.task('watch', () => {
    // Watch html files
    gulp.watch(['src/app.html'], ['html']);

    // Watch .css files
    gulp.watch('src/css/*.css', ['styles']);

    // Watch .js files
    gulp.watch(['src/js/**/*.js'], ['scripts']);
});


// default = development & production
gulp.task('default', ['clean'], () => {
    console.log('default run...');
    gulp.start('html', 'styles', 'scripts', 'watch');
});

/*
 * auto restart gulp
 **/
gulp.task('auto-restart', () => {
    let childProcess,
        cmd = process.platform === 'win32' ? 'gulp.cmd' : process.platform === 'darwin' ? 'gulp' : 'gulp',
        restart = function () {
            childProcess && childProcess.kill();
            childProcess = spawn(cmd, ['default'], {stdio: 'inherit'});
        };

    gulp.watch(['gulpfile.babel.js', './gulp-task/*.js'], restart);
    restart();
});