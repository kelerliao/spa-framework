'use strict';

import fs                   from 'fs';
import gulp                 from 'gulp';
import notify               from 'gulp-notify';
import replace              from 'gulp-replace';
import minifyHtml           from 'gulp-minify-html';
import mergeStream          from 'merge-stream';

const devReplaceHtmlFn = queryStr => {
    //console.log('_replaceHtmlFn()::queryStr=', queryStr);
    const path = queryStr.replace(/^'<%=dev\-replace:\s*/, '').replace(/\s*%>'$/, '');
    // console.log('devReplaceHtmlFn()::path=' + path + '|end');
    return fs.readFileSync(path).toString();
};

const productionReplaceHtmlFn = queryStr => {
    //console.log('productionReplaceHtmlFn()::queryStr=', queryStr);
    var path = queryStr.replace(/\n/g, '').replace(/(\s{4,}|\t|\r)/g, '').replace(/[\s\S]*?\[/).replace(/\].*/).replace(/undefined/g, '');
    path = 'production/' + path;
    // console.log('productionReplaceHtmlFn()::path=' + path + '|end');

    if (path.indexOf('.css') > 0) {
        return '<style>' + fs.readFileSync(path).toString() + '</style>';
    } else if (path.indexOf('.js') > 0) {
        return '<script>' + fs.readFileSync(path).toString() + '</script>';
    }
};

const minifyHtmlOpts = {
    cdata: false,            // 是否保留脚本CDATA
    comments: false,         // 是否保留注释
    conditionals: false,     // 是否保留IE的条件判断语句
    spare: false,            // 是否保留多余的属性
    quotes: false,           // 是否保留引用的属性
    loose: false
};

const productionRegExp = /(<!--\s*production-replace:.*-->)\n?([\s\S]*?)\n?(<!--\s*production-replace:end\s*-->)/g;

gulp.task('html', ['styles', 'scripts'], () => {
    const stream1 = gulp.src('src/app.html')
        .pipe(replace(/'<%=dev\-replace:.*%>'/g, devReplaceHtmlFn))
        .pipe(gulp.dest('development/'));

    const stream2 = gulp.src('src/app.html')
        .pipe(replace(/'<%=dev\-replace:.*%>'/g, devReplaceHtmlFn))
        .pipe(replace(productionRegExp, productionReplaceHtmlFn))
        .pipe(minifyHtml())
        .pipe(gulp.dest('production/'))
        .pipe(notify({message: '【HTML】task complete !!!'}));

    return mergeStream(stream1, stream2);
});
