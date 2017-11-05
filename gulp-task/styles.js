'use strict';

import gulp                 from 'gulp';
import notify               from 'gulp-notify';
import concat               from 'gulp-concat';
import minifyCss            from 'gulp-minify-css';
// import mergeStream          from 'merge-stream';

const appCssSrc = [
    'src/css/app.css'
];

gulp.task('styles', () => {
    return gulp.src(appCssSrc)
        .pipe(concat('app.css'))
        .pipe(gulp.dest('development/css/'))
        .pipe(minifyCss())
        .pipe(gulp.dest('production/css/'))
        .pipe(notify({ message: '【Styles】task complete !!!' }));
});
