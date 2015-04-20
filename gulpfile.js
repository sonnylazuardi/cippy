var gulp        = require('gulp');
var concat      = require('gulp-concat');
var ngHtml2Js   = require("gulp-ng-html2js");
var minifyHtml  = require("gulp-minify-html");
var uglify      = require("gulp-uglify");
var concatCss   = require('gulp-concat-css');
var stylus      = require('gulp-stylus');
var nib         = require('nib');
var vendorPath  = [
  './vendor/js/angular.js',
  './vendor/js/angular-sanitize.js',
  './vendor/js/pouchdb.js',
  './vendor/js/moment.js',
  './vendor/js/*.js'
];
var appPath = [
  './app/app.js', 
  './app/modules/*/*/*.js',
  './app/modules/*/*.js',
  './app/*/*.js', 
  './app/*/*/*.js',
];

gulp.task('assets', function() {
  gulp.src("./assets/**")
    .pipe(gulp.dest('./public/dist'));
});

gulp.task('templates', function() {
  gulp.src(["./app/partials/*.html", "./app/partials/*/*.html"])
    .pipe(minifyHtml({
      empty: true,
      spare: true,
      quotes: true
    }))
    .pipe(ngHtml2Js({
      moduleName: "partials",
      prefix: "partials/"
    }))
    .pipe(concat("partials.js"))
    .pipe(uglify())
    .pipe(gulp.dest('./public/dist/js'));
});

gulp.task('scripts', function() {
  return gulp.src(appPath)
    .pipe(concat('app.js'))
    .pipe(gulp.dest('./public/dist/js'));
});

gulp.task('stylus', function() {
  return gulp.src('./app/styles/app.styl')
    .pipe(stylus({use: nib(),compress: true}))
    .pipe(gulp.dest('./public/dist/css'));
});

gulp.task('vendor', function() {
  return gulp.src(vendorPath)
    .pipe(concat('vendor.js'))
    .pipe(uglify())
    .pipe(gulp.dest('./public/dist/js'));
});

gulp.task('vendorCss', function() {
  return gulp.src('./vendor/css/*.css')
    .pipe(concatCss('vendor.css'))
    .pipe(gulp.dest('./public/dist/css'));
});

gulp.task('default', ['vendor', 'vendorCss', 'scripts', 'stylus', 'assets', 'templates', 'watch']);

// Watch Files For Changes
gulp.task('watch', function() {
  gulp.watch(['./app/app.js', './app/*/*.js', './app/*/*/*.js'], ['scripts']);
  gulp.watch(["./app/partials/*.html", "./app/partials/*/*.html"], ['templates']);
  gulp.watch("./assets/**", ['assets']);
  gulp.watch('./vendor/css/*.css', ['vendorCss']);
  gulp.watch(vendorPath, ['vendor']);
  gulp.watch(['./app/styles/app.styl', './app/styles/*.styl', './app/styles/*/*.styl'], ['stylus']);
});