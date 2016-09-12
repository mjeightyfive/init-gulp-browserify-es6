'use strict';

import gulp from 'gulp';
import del from 'del';
import sequence from 'run-sequence';
import watchify from 'watchify';
import browserify from 'browserify';
import source from 'vinyl-source-stream';
import buffer from 'vinyl-buffer'
import browserSync from 'browser-sync';
import gulpLoadPlugins from 'gulp-load-plugins';
import { assign } from 'lodash';

const $ = gulpLoadPlugins();
const reload = browserSync.reload;

const watch = $.util.env.watch || false,
    serve = $.util.env.serve || false,
    production = $.util.env.production || false;

const isWatch = watch || serve;

const folders = {
    app: 'app',
    dist: 'dist'
}

const paths = {
    app: folders.app,
    dist: folders.dist,
    scss: folders.app + '/scss/**/*.scss',
    scssMainFile: folders.app + '/scss/styles.scss',
    js: [
        folders.app + '/js/app.js',
        folders.app + '/js/data.js'
    ],
    images: [
        folders.app + '/images/**/*'
    ],
    extras: [
        folders.app + '/favicon.ico',
        folders.app + '/apple-touch-icon-precomposed.png'
    ]
};

const AUTOPREFIXER_BROWSERS = [
    'ie >= 9',
    'ie_mob >= 10',
    'ff >= 30',
    'chrome >= 34',
    'safari >= 7',
    'opera >= 23',
    'ios >= 7',
    'android >= 4.4',
    'bb >= 10'
];

gulp.task('clean', () => del([paths.dist], {
    dot: true
}));

gulp.task('default', ['clean'], function() {
    if (watch) {
        sequence(['build'], 'watch');
    } else if (serve) {
        sequence(['build'], 'watch', 'serve');
    } else {
        gulp.start('build');
    }
});

gulp.task('build', [
    'html',
    'styles',
    'scripts',
    'images',
    'extras'
]);

gulp.task('html', () =>
    gulp.src(paths.app + '/**/*.html')
    .pipe($.if(production, $.htmlmin({
        removeComments: true,
        collapseWhitespace: true,
        collapseBooleanAttributes: true,
        removeAttributeQuotes: true,
        removeRedundantAttributes: true,
        removeEmptyAttributes: true,
        removeScriptTypeAttributes: true,
        removeStyleLinkTypeAttributes: true,
        removeOptionalTags: true
    })))
    .pipe(gulp.dest(paths.dist))
);

gulp.task('styles', () =>
    gulp.src(paths.scssMainFile)
    .pipe($.newer(paths.dist))
    .pipe($.sourcemaps.init())
    .pipe($.sass({
        precision: 10
    }).on('error', $.sass.logError))
    .pipe($.autoprefixer(AUTOPREFIXER_BROWSERS))
    .pipe(gulp.dest(paths.dist))
    .pipe($.if(production, $.cssnano()))
    .pipe($.if(!production, $.sourcemaps.write()))
    .pipe(gulp.dest(paths.dist))
);

gulp.task('scripts', () => {
    let customOpts = {
        entries: './' + paths.app + '/js/app.js',
        debug: !production
    };

    let opts = assign({}, watchify.args, customOpts);
    let b = browserify(opts);

    if (isWatch) {
        b = watchify(browserify(opts));
    }

    b.transform('babelify')

    let bundle = function() {
        return b.bundle()
            .on('error', $.util.log.bind($.util, 'Browserify Error'))
            .pipe(source('scripts.js'))
            .pipe(buffer())
            .pipe($.if(production, $.uglify()))
            .pipe(gulp.dest(paths.dist))
            .pipe($.if(isWatch, reload({
                stream: true
            })))
    };

    b.on('log', $.util.log);

    if (!production && isWatch) {
        b.on('update', bundle);
    }

    return bundle();
});

gulp.task('images', () =>
    gulp.src(paths.app + '/images/**/*')
    .pipe($.cache($.imagemin({
        progressive: true,
        interlaced: true
    })))
    .pipe(gulp.dest(paths.dist + '/images'))
);

gulp.task('extras', () =>
    gulp.src(paths.extras)
    .pipe(gulp.dest(paths.dist))
);

gulp.task('watch', () => {
    gulp.watch(paths.app + '/**/*.html', ['html', reload]);
    gulp.watch([paths.scss], ['styles', reload]);
    // gulp.watch([paths.js], ['scripts']);
    gulp.watch([paths.images], ['images', reload]);
});

gulp.task('serve', () => {
    browserSync({
        ui: false, // disable UI completely
        notify: false,
        open: false,
        logLevel: 'info',
        logConnections: true,
        localOnly: true,
        // https: true,
        // proxy: 'site.dev',
        server: {
            baseDir: paths.dist
        },
        port: 3000
    });
});
