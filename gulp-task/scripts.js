'use strict';

import fs from 'fs';
import gulp from 'gulp';
import notify from 'gulp-notify';
import uglify from 'gulp-uglify';
// import babel                from 'gulp-babel';
// import rename               from 'gulp-rename';
// import concat               from 'gulp-concat';
import replace from 'gulp-replace';
import stripDebug from 'gulp-strip-debug';
// import plumber              from 'gulp-plumber';
// import mergeStream          from 'merge-stream';
import browserify from 'browserify';
import babelify from 'babelify';
import source from 'vinyl-source-stream';
import buffer from 'vinyl-buffer';
// import watchify             from 'watchify';


const replaceJsFn = function (url) {
    const tplUrl = './src/js/pages/' + url.replace(/^<%\s*/, '').replace(/\s*%>$/, '');
    console.log('replaceJsFn():: tplUrl=', tplUrl);
    return fs.readFileSync(tplUrl).toString().replace(/\n/g, '').replace(/(\s{4,}|\t|\r)/g, '');
};

const jsErrorHandler = function (error) {
    console.log('ERROR::', error.message);

    setTimeout(() => {
        gulp.tasks['scripts'].fn();
    }, 4000);
};

gulp.task('scripts', () => {
    const bf = browserify({
        entries: 'app.js',
        // require: ['./pages/cover/index.js', './pages/show3d/index.js'],
        cache: {},
        packageCache: {},
        plugin: []
    }, { basedir: './src/js/' });

    const transform = () => {
        return bf.transform('babelify', {
            presets: ['es2015']
        })
            .bundle()
            .on('error', jsErrorHandler)
            .pipe(source('app.js'))
            .pipe(replace(/<%\s*\w+\/.*\.htm\s*%>/g, replaceJsFn))  // '<% show3d/template.htm %>'
            .pipe(buffer())
            .pipe(gulp.dest('development/js'))
            .pipe(stripDebug())
            .pipe(uglify())
            .pipe(gulp.dest('production/js'))
            .pipe(notify('【Scripts】task complete !!!'));
    };

    bf.on('update', () => {
        // gulp.start('clean', 'html');
        console.log('update--------------');
    });

    return transform();
});