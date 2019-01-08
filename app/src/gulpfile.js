var gulp = require('gulp');
var spawn = require('child_process').spawn;
var plugins = require('gulp-load-plugins')();
var merge = require('merge-stream');
const changed = require('gulp-changed');

gulp.task('default', function() {
    var process;

    function restart() {
        if (process) {
            process.kill();
        }

        process = spawn('gulp.cmd', ['watch'], {stdio: 'inherit'});
    }

    gulp.watch('gulpfile.js', restart);
    restart();
});

gulp.task('smiles',function() {
    return  gulp.src('scss/*.scss')
        .pipe(plugins.compass({
            config_file: './compass-config.rb',
            project: __dirname,
            css: '../www/css',
            sass: 'scss',
            image: 'img',
            generated_images_path:'../www/img'
        }))
        .pipe(gulp.dest('../www/css'));
});

var app_files=[
    'app/app.js',
    'app/**/*.js'
];


gulp.task('appjs', function () {
    return gulp.src(app_files)
        .pipe(plugins.plumber(function(error) {plugins.util.colors.red(error.message);this.emit('end');plugins.runSequence('appjs');}))
        .pipe(plugins.jshint())
        .pipe(plugins.jshint.reporter('default',{verbose:true}))
        .pipe(plugins.sourcemaps.init())
        .pipe(plugins.concat('app.js'))
        .pipe(plugins.sourcemaps.write('../../maps'))
        .pipe(gulp.dest('../www/js'));
});


gulp.task('appjsmin', function () {
    return gulp.src(app_files)
        .pipe(plugins.plumber(function(error) {plugins.util.colors.red(error.message);this.emit('end');plugins.runSequence('appjsmin');}))
        .pipe(plugins.sourcemaps.init())
        .pipe(plugins.concat('app.js'))
        .pipe(plugins.ngAnnotate())
        .pipe(plugins.uglify({
            mangle: false
        }))
        .pipe(plugins.sourcemaps.write('../../maps'))
        .pipe(gulp.dest('../www/js'));
});


gulp.task('jslibs', function () {
    return gulp.src([
        'bower_components/jquery/dist/jquery.js',
        'bower_components/angular/angular.js',
        //'bower_components/angular-touch/angular-touch.js',
        'bower_components/angular-once/once.js',
        'bower_components/es5-shim/es5-shim.js',
        'bower_components/es5-shim/es5-sham.js',
        'bower_components/angular-file-upload/dist/angular-file-upload.min.js',
        'bower_components/socket.io-client/socket.io.js',
        'bower_components/ngstorage/ngStorage.js',
        'bower_components/ngCordova/dist/ng-cordova.js',
        'bower_components/exif-js/exif.js',
        'bower_components/angular-elastic/elastic.js',
        'bower_components/angular-gettext/dist/angular-gettext.js',
        'bower_components/angular-sanitize/angular-sanitize.js',
        'bower_components/photoswipe/dist/photoswipe.js',
        'bower_components/photoswipe/dist/photoswipe-ui-default.js',
        'kendo-ui-core/dist/js/kendo.ui.core.js',
        'kendo-ui-core/dist/js/kendo.angular.js',
        'kendo-ui-core/dist/js/kendo.mobile.application.js',
        'bower_components/angular-dynamic-locale/dist/tmhDynamicLocale.js',
		'libs/swiper/dist/js/swiper.js',
        'libs/angular-swiper/dist/angular-swiper.js',
        'libs/angular-facebook-pixel/angular-facebook-pixel.js',
		'bower_components/angular-bootstrap-multiselect/dist/angular-bootstrap-multiselect.js',
        'libs/ant-media-server/adapter-latest.js',
        'libs/ant-media-server/webrtc-adaptor.js'
    ])
        .pipe(plugins.plumber(function(error) {plugins.util.colors.red(error.message);this.emit('end');plugins.runSequence('jslibs');}))
        .pipe(plugins.sourcemaps.init({loadMaps: true}))
        .pipe(plugins.concat('libs.js'))
        .pipe(plugins.ngAnnotate())
        .pipe(plugins.uglify())
        .pipe(plugins.sourcemaps.write('../../maps'))
        .pipe(gulp.dest('../www/js'));
});


gulp.task('kendoui-css',function() {
    return merge (
        gulp.src([
            'kendo-ui-core/dist/styles/mobile/kendo.mobile.android.light.min.css',
            'kendo-ui-core/dist/styles/mobile/kendo.mobile.ios.min.css',
            'kendo-ui-core/dist/styles/mobile/kendo.mobile.wp8.min.css',
        ])
            .pipe(plugins.plumber(function(error) {plugins.util.colors.red(error.message);this.emit('end');plugins.runSequence('kendoui-css');}))
            .pipe(plugins.cssmin())
            .pipe(gulp.dest('../www/css'))
    ,
        gulp.src([
            'kendo-ui-core/dist/styles/mobile/images/*'
        ])
            //.pipe(plugins.plumber())
            .pipe(gulp.dest('../www/css/images'))
    );
});


gulp.task('css',function() {
    return merge(
        gulp.src([
            'css/common/*.css','bower_components/swiper/dist/css/swiper.min.css'
        ])
            .pipe(plugins.plumber(function(error) {plugins.util.colors.red(error.message);this.emit('end');plugins.runSequence('css');}))
            .pipe(plugins.sourcemaps.init({loadMaps: true}))
            .pipe(plugins.concat('common.css'))
            .pipe(plugins.sourcemaps.write('../../maps'))
            .pipe(gulp.dest('../www/css'))
    ,
        gulp.src([
            'css/android/*.css'
        ])
            .pipe(plugins.plumber(function(error) {plugins.util.colors.red(error.message);this.emit('end');plugins.runSequence('css');}))
            .pipe(plugins.sourcemaps.init({loadMaps: true}))
            .pipe(plugins.concat('android.css'))
            .pipe(plugins.sourcemaps.write('../../maps'))
            .pipe(gulp.dest('../www/css'))
    ,
        gulp.src([
            'css/ios/*.css'
        ])
            .pipe(plugins.plumber(function(error) {plugins.util.colors.red(error.message);this.emit('end');plugins.runSequence('css');}))
            .pipe(plugins.sourcemaps.init({loadMaps: true}))
            .pipe(plugins.concat('ios.css'))
            .pipe(plugins.sourcemaps.write('../../maps'))
            .pipe(gulp.dest('../www/css'))
    ,
        gulp.src([
            'css/wp/*.css'
        ])
            .pipe(plugins.plumber(function(error) {plugins.util.colors.red(error.message);this.emit('end');plugins.runSequence('css');}))
            .pipe(plugins.sourcemaps.init({loadMaps: true}))
            .pipe(plugins.concat('wp.css'))
            .pipe(plugins.sourcemaps.write('../../maps'))
            .pipe(gulp.dest('../www/css'))
    );
});

gulp.task('sound',function() {
    return gulp.src([
        'sound/*'
    ])
        .pipe(gulp.dest('../www'));
});

gulp.task('html',function() {
    return merge(
        gulp.src([
            'html/index.html'
        ])
//            .pipe(plugins.plumber(function(error) {plugins.util.colors.red(error.message);this.emit('end');plugins.runSequence('html');}))
            .pipe(plugins.preprocess())
            .pipe(gulp.dest('../www'))
        ,
        gulp.src([
            'html/view-*',
            'html/.htaccess'
        ])
            .pipe(changed('../www'))
            .pipe(plugins.plumber(function(error) {plugins.util.colors.red(error.message);this.emit('end');plugins.runSequence('html');}))
            .pipe(gulp.dest('../www'))
    );
});


gulp.task('img',function() {
    return gulp.src([
        'img/*',
        'img/**/*',
        '!img/smiles',
        '!img/smiles/*',
        '!img/smiles/**/',

    ])
        .pipe(plugins.plumber(function(error) {plugins.util.colors.red(error.message);this.emit('end');plugins.runSequence('img');}))
        .pipe(gulp.dest('../www/img/'));
});

gulp.task('fonts',function() {
    return gulp.src([
        'fonts/*'
    ])
        .pipe(plugins.plumber(function(error) {plugins.util.colors.red(error.message);this.emit('end');plugins.runSequence('fonts');}))
        .pipe(gulp.dest('../www/fonts'));
});


gulp.task('pot', function () {
    return gulp.src(['html/*.html', 'app/**/*.js'])
        .pipe(plugins.angularGettext.extract('app.pot', {
            // options to pass to angular-gettext-tools...
        }))
        .pipe(gulp.dest('po/'));
});

gulp.task('po', function () {
    return gulp.src('po/*.po')
        .pipe(plugins.angularGettext.compile({
            // options to pass to angular-gettext-tools...
        }))
        .pipe(plugins.concat('translations.js'))
        .pipe(gulp.dest('../www/js/'));
});

gulp.task('i18n',function() {
    return gulp.src([
        'bower_components/angular-i18n/angular-locale_de.js',
		'bower_components/angular-i18n/angular-locale_ru.js',
        'bower_components/angular-i18n/angular-locale_en.js'
    ])
        .pipe(gulp.dest('../www/js/'));
});

gulp.task('deploy',['po','kendoui-css','jslibs','smiles','css','html','appjs','appjsmin','img','fonts','sound', 'i18n'],function(){});

gulp.task('watch',['deploy'],function() {
    plugins.watch([
        'app/**/*.js',
        'app/*.js'
    ], plugins.batch(function (events, done) {
        gulp.start('appjs', done);
    }));

    plugins.watch([
        'css/**/*.css'
    ], plugins.batch(function (events, done) {
        gulp.start('css', done);
    }));

    plugins.watch([
        'html/*.html'
    ], plugins.batch(function (events, done) {
        gulp.start('html', done);
    }));

    plugins.watch([
        'fonts/*'
    ], plugins.batch(function (events, done) {
        gulp.start('fonts', done);
    }));

    plugins.watch([
        'img/*',
        'img/**/*',
    ], plugins.batch(function (events, done) {
        gulp.start('img', done);
    }));
});
