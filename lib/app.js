var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

// require("babel-polyfill")
const fs = require('fs');
const es6Promise = require('es6-promise/auto');
const fetch = require('isomorphic-fetch');

const featuresTopicID = '200092870';
const integrationsTopicID = '200556938';
const baseURL = 'https://vision6.zendesk.com/api/v2/';

function generateFeaturePosts(posts) {
  return posts.map(function (post) {
    return {
      id: post.id,
      title: post.title,
      details: post.details,
      voteCount: post.vote_count,
      createdAt: post.created_at
    };
  });
}

function fetchCommentsByPostID(postID) {
  return fetch(`${ baseURL }community/posts/${ postID }/comments.json`).then(function (response) {
    return response.json();
  }).then(function (json) {
    return Promise.resolve(json.comments);
  });
}

function saveFile(contents) {
  console.log('Saving to disk...');
  fs.writeFile('data.json', contents, err => {
    if (err) throw err;
    console.log('It\'s saved!');
  });
}

fetch(`${ baseURL }community/topics/${ featuresTopicID }/posts.json`).then(function (response) {
  return response.json();
}).then(function (json) {
  const featurePosts = generateFeaturePosts(json.posts);
  return Promise.resolve(featurePosts);
}).then(function (featurePosts) {
  console.log('Fetching post comments...');
  const newFeaturePostsPromises = featurePosts.map(function (post) {
    return fetchCommentsByPostID(post.id).then(function (comments) {
      console.log('Bundling post comments...');
      return Promise.resolve(_extends({}, posts, { comments }));
    });
  });

  console.log('.....');
  Promise.all(newFeaturePostsPromises).then(function (values) {
    saveFile(JSON.stringify(values));
  });
});