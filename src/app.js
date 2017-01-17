const fs = require('fs')
const es6Promise = require('es6-promise/auto')
const fetch = require('isomorphic-fetch')

const featuresTopicID = '200092870'
const integrationsTopicID = '200556938'
const baseURL = 'https://vision6.zendesk.com/api/v2/'

function generateFeaturePosts (posts) {
  return posts.map(function (post) {
    return {
      id: post.id,
      title: post.title,
      details: post.details,
      voteCount: post.vote_count,
      createdAt: post.created_at
    }
  })
}

function fetchCommentsByPostID (postID) {
  return fetch(`${baseURL}community/posts/${postID}/comments.json`)
    .then(function (response) {
      return response.json()
    })
    .then(function (json) {
      return Promise.resolve(json.comments)
    })
}

function saveFile (contents) {
  console.log('Saving to result disk...')
  fs.writeFile(`${Date.now()}-data.json`, contents, (err) => {
    if (err) throw err
    console.log('File saved!')
  })
}

const fetchData = function () {
  const goFetch = function (posts = [], url = `${baseURL}community/topics/${featuresTopicID}/posts.json?page=1&per_page=30`) {
    console.log('Fetching from: ', url)
    return fetch(url)
      .then(function (response) {
        return response.json()
      })
      .then(function (json) {
        posts = [...posts, ...json.posts]

        if (json.next_page) {
          return goFetch(posts, json.next_page)
        } else {
          console.log(`Completed fetching ${posts.length} posts!`)
          return posts
        }
      })
  }

  return goFetch()
}

console.log('Begin fetching...')
fetchData()
  .then(function (posts) {
    const featurePosts = generateFeaturePosts(posts)
    return Promise.resolve(featurePosts)
  })
  .then(function (featurePosts) {
    console.log('Fetching post comments...')
    const newFeaturePostsPromises = featurePosts.map(function (post) {
      return fetchCommentsByPostID(post.id).then(function (comments) {
        return Promise.resolve({ ...post, comments })
      })
    })

    Promise.all(newFeaturePostsPromises).then(function (values) {
      saveFile(JSON.stringify(values))
    }).catch((error) => {
      console.log(error)
    })
  })
