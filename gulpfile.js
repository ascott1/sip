var gulp = require('gulp'),
    path = require('path'),
    less = require('gulp-less'),
    autoprefixer = require('gulp-autoprefixer'),
    minifycss = require('gulp-minify-css'),
    jshint = require('gulp-jshint'),
    uglify = require('gulp-uglify'),
    imagemin = require('gulp-imagemin'),
    rename = require('gulp-rename'),
    concat = require('gulp-concat'),
    notify = require('gulp-notify'),
    cache = require('gulp-cache'),
    livereload = require('gulp-livereload'),
    del = require('del'),
    frontMatter = require('gulp-front-matter'),
    marked = require('gulp-marked'),
    swig = require('swig'),
    swigExtras = require('swig-extras'),
    through = require('through2'),
    merge = require('merge-stream');

// site config
var site = {
    'title': 'Site Title',
    'url': '',
    'urlRoot': '/',
    'author': '',
    'email': '',
    'time': new Date()
};

// swig template configs
swig.setDefaults({
    loader: swig.loaders.fs(__dirname + '/src/templates'),
    cache: false
});
swigExtras.useFilter(swig, 'truncate');

function applyTemplate(templateFile) {
    var tpl = swig.compileFile(path.join(__dirname, templateFile));

    return through.obj(function (file, enc, cb) {
        var data = {
            site: site,
            page: file.page,
            content: file.contents.toString()
        };
        file.contents = new Buffer(tpl(data), 'utf8');
        this.push(file);
        cb();
    });
};

gulp.task('pages', function () {
    var html = gulp.src(['content/pages/*.html'])
        .pipe(frontMatter({property: 'page', remove: true}))
        .pipe(through.obj(function (file, enc, cb) {
            var data = {
                //site: site,
                page: {}
            };
            var tpl = swig.compileFile(file.path);
            file.contents = new Buffer(tpl(data), 'utf8');
            this.push(file);
            cb();
        }));

    var markdown = gulp.src('content/pages/*.md')
        .pipe(frontMatter({property: 'page', remove: true}))
        .pipe(marked())
        .pipe(applyTemplate('src/templates/page.html'))
        .pipe(rename({extname: '.html'}));

    return merge(html, markdown)
        .pipe(gulp.dest('dist'));
        //.pipe(connect.reload())
});

// less/css tasks
gulp.task('styles', function() {
  return gulp.src('src/less/main.less')
    .pipe(less({ style: 'expanded' }))
    .pipe(autoprefixer('last 2 version', 'safari 5', 'ie 8', 'ie 9', 'opera 12.1', 'ios 6', 'android 4'))
    .pipe(gulp.dest('dist/assets/css'))
    .pipe(rename({suffix: '.min'}))
    .pipe(minifycss())
    .pipe(gulp.dest('dist/assets/css'))
    .pipe(notify({ message: 'Styles task complete' }));
});

// js tasks
gulp.task('scripts', function() {
  return gulp.src('src/js/**/*.js')
    .pipe(jshint())
    .pipe(jshint.reporter('default'))
    .pipe(concat('main.js'))
    .pipe(gulp.dest('dist/assets/js'))
    .pipe(rename({suffix: '.min'}))
    .pipe(uglify())
    .pipe(gulp.dest('dist/assets/js'))
    .pipe(notify({ message: 'Scripts task complete' }));
});

// image tasks
gulp.task('images', function() {
  return gulp.src('src/img/**/*')
    .pipe(imagemin({ optimizationLevel: 3, progressive: true, interlaced: true }))
    .pipe(gulp.dest('dist/assets/img'))
    .pipe(notify({ message: 'Images task complete' }));
});

// copy html
gulp.task('copyhtml', function() {
    gulp.src('src/**/*.html').pipe(gulp.dest('dist/'));
});

// clean dist folder
gulp.task('clean', function(cb) {
    del(['dist/assets/css', 'dist/assets/js', 'dist/assets/img'], cb);
});

// watch files
gulp.task('watch', function() {
  gulp.watch('src/less/**/*.less', ['styles']);
  gulp.watch('src/js/**/*.js', ['scripts']);
  gulp.watch('src/img/**/*', ['images']);
  gulp.watch('src/partials/**/*', ['pages']);
  gulp.watch('src/templates/**/*', ['pages']);
  gulp.watch('content/**/*', ['pages']);

  //live reload
  livereload.listen();
  gulp.watch(['dist/**']).on('change', livereload.changed);
});

// default tasks
gulp.task('default', ['clean'], function() {
    gulp.start('styles', 'scripts', 'images');
});