const concat = require('gulp-concat');
const gulp = require('gulp');
const prefix = require('gulp-autoprefixer');
const gsass = require('gulp-sass')(require('sass'));
const pug = require('gulp-pug-3');

gulp.task('pug', function () {
  return gulp.src('pug/**/*.pug')
    .pipe(pug({
      pretty: true,
    }))
    .pipe(gulp.dest('./'))
})

gulp.task('sass', function () {
  return gulp.src('pug/**/*.scss')
    .pipe(gsass({
      outputStyle: 'expanded'
    }).on('error', gsass.logError))
    .pipe(prefix({
      cascade: true
    }))
    .pipe(concat('vastgrimm.css'))
    .pipe(gulp.dest('./css'))
})

gulp.task('watch', gulp.series(['pug', 'sass'], () => {
  gulp.watch('source/**/*.scss', gulp.series(['sass']))
  gulp.watch(['source/**/*.pug','source/**/*.js'], gulp.series(['html']))
}))
