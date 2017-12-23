'use strict';

import gulp                 from 'gulp';
import sass                 from 'gulp-sass';
import notify               from 'gulp-notify';
import concat               from 'gulp-concat';
import minifyCss            from 'gulp-minify-css';
// import mergeStream          from 'merge-stream';

const appCssSrc = [
    'src/css/app.scss'
];

gulp.task('styles', () => {
    return gulp.src(appCssSrc)
        .pipe(concat('app.scss'))
        .pipe(sass())
        .pipe(gulp.dest('development/css/'))
        .pipe(minifyCss())
        .pipe(gulp.dest('production/css/'))
        .pipe(notify({ message: '【Styles】task complete !!!' }));
});
