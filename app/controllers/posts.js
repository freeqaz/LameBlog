/**
 * Created by JetBrains WebStorm.
 * User: mike
 * Date: 9/14/11
 * Time: 9:35 PM
 * To change this template use File | Settings | File Templates.
 */

const md = require('node-markdown').Markdown
    , Flow = require('nestableflow');

const PAGE_SIZE = 5;

module.exports.index = function(req, res, next) {
    var Post = req.app.set('db').posts;
    var Tag = req.app.set('db').tag;
    
    var skip = req.query.page ? (req.query.page - 1) * PAGE_SIZE : 0;
    var limit = PAGE_SIZE;

    var where = { hidden: false };

    if (req.query.tags)
        where.tags = req.query.tags;

    var query = req.query.search;

    var allTags;
    var pages = [];

    var root = Flow.serial(
        function(flow) {
            Post.count(where, flow.next);
        },
        function(flow, count) {
            for (var ii = 0;ii < Math.ceil(count / PAGE_SIZE);ii++)
                pages.push(ii + 1);

            Tag.find({  }, flow.next);
        },
        function(flow, data) {
            allTags = data.map(function(p) {
                return {
                    name: p.name,
                    count: p.posts.length
                };
            }).filter(function(p) {
                return p.count;
            }).sort(function(x, y) {
                return y.count - x.count;
            });

            Post.find(where, [], { sort: [ [ 'publishDate', 'descending' ] ], limit: PAGE_SIZE, skip: skip }, flow.next);
        },
        function(flow, data) {
            res.render('post/index', {
                layout: false,
                posts: data,
                fbAppId: req.app.set('fbAppId'),
                pageCount: pages.length,
                pages: pages,
                currentPage: req.query.page ? req.query.page : 1,
                tags: allTags
            });
        }
    );

    root.onError = function(err) {
        console.log('error', err);
    };

    root.start();
};

module.exports.search = function(req, res, next) {
    
};

module.exports.getPost = function(req, res, next) {
    var Post = req.app.set('db').posts;
    var params = req.app.set('params');
    
    var self = {};
    var root = Flow.serial(
        function(flow) {
            Post.findByPath(req.params.id, flow.next);
        },
        function(flow, data) {
            if (data)
            {
                self.data = data;
                Post.find({ _id: { $ne: self.data._id } }, [], { sort: [ [ 'publishDate', 'descending' ] ], limit: 3 }, flow.next);
            }
            else {
                res.redirect('/');
            }
        },
        function(flow, recent) {
            self.recent = recent;
            Post.find({ hidden: false, tags: { $in : self.data.tags }, _id: { $ne : self.data._id } }, [], { sort: [ [ 'publishDate', 'descending' ] ], limit: 3 }, flow.next);
        },
        function(flow, tagged) {
            res.render('post/view', {
                layout: false,
                post: self.data,
                recent: self.recent,
                related: tagged,
                fbData: {
                    fbAppId: req.app.set('fbAppId'),
                    ogTitle: self.data.title,
                    ogUrl: 'http://' + req.app.set('domain') + self.data.path,
                    ogSiteName: req.app.set('sitename'),
                    ogImageUrl: 'http://' + req.app.set('domain') + '/public/images/logo.png',
                    ogDescription: '',
                    ogType: params.ogType,
                    ogComment: params.ogComment
                },
                pageTitle: self.data.title
            });
        }
    );

    root.onError = function(err) {
        console.log('error', err);
    };

    root.start();
};

module.exports.renderMarkdown = function(req, res, next) {
    res.render('post/preview', { layout: false, body: md(decodeURIComponent(req.body.data)) });
};

module.exports.addComment = function(req, res, next) {
    var Post = req.app.set('db').posts;
    var Comment = req.app.set('db').comments;

    Post.findById(req.params.postId, function(err, data) {
        var comment = new Comment({
            name: req.body.comment.name,
            email: req.body.comment.email,
            message: req.body.comment.message
        });

        if (!data.comments)
            data.comments = [ ];

        data.comments.push(comment);
        data.save(function(err) {
            res.send({
                name: comment.name,
                message: comment.message,
                displayDate: comment.displayDate
            });
        });
    });
};

module.exports.getComments = function(req, res, next) {
    var Post = req.app.set('db').posts;

    Post.findById(req.params.id, function(err, data) {
        res.send({
            comments: data.comments.slice(req.params.start, req.params.end),
            totalComments: data.comments.length
        });
    });
};