# Unchained UI

## Views UI Component

[![NPM Version](https://img.shields.io/npm/v/uc-views.svg?style=flat-square)](https://www.npmjs.com/package/uc-views)
[![NPM Downloads](https://img.shields.io/npm/dt/uc-views.svg?style=flat-square)](https://www.npmjs.com/package/uc-views)


### Usage

```js
import Views from 'uc-views';
import Post from './views/post';
import Page from './views/page';

// ... init your app ...

const views = new Views({
  routes: [
    [ 'post', '/post(/:slug)', Post ],
    [ 'page', '/(:page)', Page ]
  ]
}).appendTo(document.body);

```

```css
@import 'uc-views/style.css';
```

This component follows **Unchained** UI guidelines.

Constructor options:

* __routes__ array, routes and views mapping. Each element is an array. `[<name>, <pattern>, <ViewClass> [, AuthenticatedViewClass]]`. If `AuthenticatedViewClass` is present, the views will show it instead of the `ViewClass` when app is authenticated. Check the [uc-app](https://github.com/unchained/app) for more info.
* onChange — function, callback will be called when view is changed.
* el — HTMLElement, the views container. If ommited the `div.views` is created.
* rootEl — HTMLElement, default `html`, top element to apply active view classes.
* rootPath - string, root path

### Methods

#### remove()

Removes the views.

### View

The `View` is a simple JavaScript class. The only requirements are:

* __el__ – HTMLElement, the view element.
* __name__ – string, the name of the view.
* __state__ - method to receive the current state.

The `View` can have the following methods.

`willOpen`, `didOpen`, `willClose`, `didClose`. Will- methods are asynchronous.

Example:

```js
import { create } from 'uc-dom';

const Page = function() {
  this.el = create('div.view.view-page');
}
Page.prototype = {
  name: 'Page',
  state: function(state, cb) {
    console.log('Page state', state);
    cb();
    // here we can return an error: cb(new Error());
    // or replace the history state: cb(null, '/newurl');
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
```

License MIT

© velocityzen

