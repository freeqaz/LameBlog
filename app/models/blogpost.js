/**
 * Created by JetBrains WebStorm.
 * User: mike
 * Date: 9/14/11
 * Time: 12:37 AM
 * To change this template use File | Settings | File Templates.
 */

const dateformat = require("dateformat")
    , zoneinfo = require('zoneinfo')
    , client = require('redis').createClient()
    , TZDate = zoneinfo.TZDate;

var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    Comment = require('./comment'),
    ObjectId = Schema.ObjectId,
    md = require('node-markdown').Markdown;

var BlogPost = module.exports = new Schema({
    owner: ObjectId
    , title: { type: String, unique: true }
    , body: { type: String, index: true }
    , path: { type: String, index: true, unique: true }
    , comments: [Comment]
    , tags: { type: Array, index: true }
    , views: Number
    , publishDate: { type: Date, index: true }
    , hidden: Boolean
    , createDate: { type: Date, default: Date.now }
});

BlogPost.virtual('htmlbody').get(function() {
    return md(this.body);
});

BlogPost.virtual('description').get(function() {
    if (this.body.length < 150)
        return this.body;
    else
        return this.body.substring(0, 150) + '...';
});

BlogPost.virtual('commentCount').get(function() {
    return this.comments.length;
});

BlogPost.virtual('displayDate').get(function() {
    var ex = new TZDate(this.publishDate.getTime(), 'America/Los_Angeles');
    return ex.format('m-d-Y h:i A T');
});

BlogPost.virtual('localTime').get(function() {
    var ex = new TZDate(this.publishDate.getTime(), 'America/Los_Angeles');
    return ex.format('m-d-Y h:i A');
});

BlogPost.statics.findByPath = function(path, callback) {
    this.findOne({ path: '/' + path }, callback);
};

