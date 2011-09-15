/**
 * Created by JetBrains WebStorm.
 * User: mike
 * Date: 9/14/11
 * Time: 12:27 AM
 * To change this template use File | Settings | File Templates.
 */

    const express = require('express')
    , mongoose = require('mongoose')
    , storage = require('../lib/storage')(process.env.STORAGE_PLATFORM || 'localfilestorage');
//, nib       = require('nib');

/**
 *  Exports
 */

module.exports = function(app) {

    //  Setup DB Connection

    var dblink = process.env.MONGOLAB_URI || 'mongodb://localhost/lameblog';

    const db = mongoose.createConnection(dblink);

    //  Configure expressjs

    app.configure(function () {
        this
            .use(express.cookieParser())
            .use(express.bodyParser())
            .use(express.errorHandler({dumpException: true, showStack: true}))
            .use(express.session({ secret: 'secret key'}))
    });

    //  Add template engine

    app.configure(function() {
        this
            .set('views', __dirname + '/../app/views')
            .set('view engine', 'jade')
            .use(express.static(__dirname + '/../public'))
    });

    //  Save reference to database connection

    app.configure(function () {
        app.set('db', {
            'main': db
            , 'users': db.model('User')
            , 'posts': db.model('BlogPost')
        })
        app.set('version', '1.0.0');
    });

    //  Configure File Storage

    app.configure(function() {
        app.set('media', storage);
    });

    return app;
}