import { ready, get, create } from 'uc-dom';
import app from 'uc-app';
import Views from './index';

// define views classes
const Post = function() {
  this.el = create('div.view.view-post', '<a soft href="/">Index</a>');
}
Post.prototype = {
  name: 'post',
  state: function(state, cb) {
    console.log('post state', state);
    cb();
  }
}

const Page = function() {
  this.el = create('div.view.view-page', `
    <a soft href="/">Index</a><br>
    <a soft href="/page">Page</a><br>
    <a soft href="/post/test-post">Post</a><br>
  `);
}
Page.prototype = {
  name: 'Page',
  state: function(state, cb) {
    console.log('Page state', state);
    cb();
  },

  willOpen: function(cb) {
    console.log('page will open');
    cb();
  },

  didOpen: function() {
    console.log('page did open');
  },

  willClose: function(cb) {
    console.log('page will close');
    cb();
  },

  didClose: function() {
    console.log('page did close');
  }
}

// run the app
ready(() => {
  const elDisplay = get('#display');

  app.init({
    container: 'body',
    logName: 'mm',
    logLevel: 7
  }, () => app.start());

  const views = new Views({
    routes: [
      [ 'post', '/post(/:slug)', Post ],
      [ 'page', '/(:page)', Page ]
    ],
    onChange: (err, view) => console.log(err, view)
  }).appendTo(elDisplay);

  setTimeout(() => views.remove(), 5000);
});
