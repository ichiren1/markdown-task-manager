var gulp = require('gulp')

gulp.task('hello', function(){
  console.log("hello, world")
});

gulp.task('default', ['hello'])
