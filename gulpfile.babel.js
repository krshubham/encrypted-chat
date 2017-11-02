const gulp = require('gulp');
const uglify = require('gulp-uglify');
const nodemon = require('nodemon');
const browserify = require('browserify');
const babel = require('babelify');
const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');
const childProcess = require('child_process');

let spawn = childProcess.spawn;

gulp.task('bundle', function() {
  return browserify('src/js/main.js', {
    debug: true
  }).transform(babel.configure({
    presets: ['es2015']
  })).bundle()
  .pipe(source('main.js'))
  .pipe(buffer())
  .pipe(uglify())
  .pipe(gulp.dest('src/public'));
});

gulp.task('dev', function() {
  return browserify('src/js/main.js', {
    debug: true
  }).transform(babel.configure({
    presets: ['es2015']
  })).bundle()
  .pipe(source('main.js'))
  .pipe(buffer())
  .pipe(gulp.dest('src/public'));
});

gulp.task('start', function() {
  nodemon({
    script: 'index.js',
    ext: 'css js mustache',
    ignore: ['src/public/main.js', 'test'],
    env: {
      'NODE_ENV': 'development'
    },
    tasks: ['dev']
  });
});

gulp.task('test', function() {
  let lintTest = spawn(
    'node_modules/mocha/bin/mocha',
    ['test/unit/lint.js', '--compilers', 'js:babel-core/register'],
    {stdio: 'inherit'}
  );

  lintTest.on('exit', function() {

    let unitTest = spawn('node_modules/karma/bin/karma', ['start', '--single-run'], {stdio: 'inherit'});

    unitTest.on('exit', function() {

      // Start app
      let app = spawn('node', ['index.js']);

      app.stdout.on('data', function(data) {
        console.log(String(data));
      });

      let acceptanceTest = spawn(
        'node_modules/nightwatch/bin/nightwatch',
        ['--test', 'test/acceptance/index.js', '--config', 'test/acceptance/nightwatch-local.json'],
        {stdio: 'inherit'}
      );

      acceptanceTest.on('exit', function() {
        // Kill app Node process when tests are done
        app.kill();
      });

    });
  });

});
