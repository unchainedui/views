(function () {
  'use strict';

  const rxQuery = /^\s*([>+~])?\s*([*\w-]+)?(?:#([\w-]+))?(?:\.([\w.-]+))?\s*/;
  const rxClassOnly = /^\.([-\w]+)$/;
  const rxIdOnly = /^#([-\w]+)$/;

  function get(selector, root = document) {
    const id = selector.match(rxIdOnly);
    if (id) {
      return document.getElementById(id[1]);
    }

    const className = selector.match(rxClassOnly);
    if (className) {
      return root.getElementsByClassName(className[1]);
    }

    return root.querySelectorAll(selector);
  }

  function query(selector) {
    let f;
    const out = [];
    if (typeof selector === 'string') {
      while (selector) {
        f = selector.match(rxQuery);
        if (f[0] === '') {
          break;
        }

        out.push({
          rel: f[1],
          tag: (f[2] || '').toUpperCase(),
          id: f[3],
          classes: (f[4]) ? f[4].split('.') : undefined
        });
        selector = selector.substring(f[0].length);
      }
    }
    return out;
  }

  function createNs(namespaceURI, selector) {
    const s = query(selector)[0];
    const tag = s.tag;
    if (!tag) {
      return null;
    }

    const el = document.createElementNs(namespaceURI, tag);
    const id = s.id;
    if (id) {
      el.id = id;
    }

    const classes = s.classes;
    if (classes) {
      el.className = classes.join(' ');
    }

    return el;
  }

  function create(selector, content) {
    const s = query(selector)[0];
    const tag = s.tag;
    if (!tag) {
      return null;
    }

    const el = document.createElement(tag);
    const id = s.id;
    if (id) {
      el.id = id;
    }

    const classes = s.classes;
    if (classes) {
      el.className = classes.join(' ');
    }

    if (content) {
      el.innerHTML = content;
    }

    return el;
  }

  function closest(el, selector) {
    while (!el.matches(selector) && (el = el.parentElement));
    return el;
  }

  function attr(el, name, value) {
    if (value === undefined) {
      return el.getAttribute(name);
    }

    el.setAttribute(name, value);
  }

  function append(parent, el) {
    parent.appendChild(el);
    return parent;
  }

  function prepend(parent, el) {
    parent.insertBefore(el, parent.firstChild);
    return parent;
  }

  function appendTo(el, parent) {
    parent.appendChild(el);
    return el;
  }

  function prependTo(el, parent) {
    parent.insertBefore(el, parent.firstChild);
    return el;
  }

  function ready(fn) {
    if (document.readyState !== 'loading') {
      fn();
    } else {
      document.addEventListener('DOMContentLoaded', fn);
    }
  }

  function on(el, event, selector, handler, options) {
    if (typeof selector !== 'string') {
      handler = selector;
      selector = undefined;
    }

    if (!selector) {
      el.addEventListener(event, handler, options);
      return handler;
    }

    return on(el, event, e => {
      const target = closest(e.target, selector);
      if (target) {
        handler.call(target, e);
      }
    }, options);
  }

  function off(el, event, handler, options) {
    el.removeEventListener(event, handler, options);
    return handler;
  }

  function once(el, event, handler, options) {
    const _handler = (...args) => {
      handler(...args);
      off(el, event, handler);
    };

    el.addEventListener(event, handler, options);
    return _handler;
  }

  const ALL_EVENTS = '__events';
  function onEvents(ctx, events) {
    if (!ctx[ALL_EVENTS]) {
      ctx[ALL_EVENTS] = {};
    }

    for (const event in events) {
      ctx[ALL_EVENTS][event] = on(ctx.el, event, events[event]);
    }
  }

  function offEvents(ctx) {
    const events = ctx[ALL_EVENTS];
    for (const event in events) {
      off(ctx.el, event, events[event]);
    }
    delete ctx[ALL_EVENTS];
  }

  function addClass(el, ...cls) {
    return el.classList.add(...cls);
  }

  function removeClass(el, ...cls) {
    return el.classList.remove(...cls);
  }

  function toggleClass(el, cls, force) {
    return el.classList.toggle(cls, force);
  }

  function addDelayRemoveClass(el, cls, delay, cb) {
    addClass(el, cls);
    return setTimeout(() => {
      removeClass(el, cls);
      cb && cb();
    }, delay);
  }

  function replaceClass(el, rx, newClass) {
    const newClasses = [];
    attr(el, 'class').split(' ').forEach(function(cls) {
      const c = rx.test(cls) ? newClass : cls;

      if (newClasses.indexOf(c) === -1) {
        newClasses.push(c);
      }
    });

    attr(el, 'class', newClasses.join(' '));
    return newClasses.length;
  }

  function insertBefore(el, node) {
    return node.parentNode.insertBefore(el, node);
  }

  function insertAfter(el, node) {
    return node.parentNode.insertBefore(el, node.nextSibling);
  }

  function remove(el) {
    return el.parentNode.removeChild(el);
  }

  var dom = /*#__PURE__*/Object.freeze({
    get: get,
    query: query,
    createNs: createNs,
    create: create,
    closest: closest,
    attr: attr,
    append: append,
    prepend: prepend,
    appendTo: appendTo,
    prependTo: prependTo,
    ready: ready,
    on: on,
    off: off,
    once: once,
    ALL_EVENTS: ALL_EVENTS,
    onEvents: onEvents,
    offEvents: offEvents,
    addClass: addClass,
    removeClass: removeClass,
    toggleClass: toggleClass,
    addDelayRemoveClass: addDelayRemoveClass,
    replaceClass: replaceClass,
    insertBefore: insertBefore,
    insertAfter: insertAfter,
    remove: remove
  });

  function compose(...args) {
    let newObject = true;

    if (args[args.length - 1] === true) {
      args.pop();
      newObject = false;
    }

    newObject && args.unshift({});
    return Object.assign.apply(Object, args);
  }

  /*eslint-disable strict */

  const html = [
    'addClass',
    'removeClass',
    'toggleClass',
    'replaceClass',
    'appendTo',
    'prependTo',
    'insertBefore',
    'insertAfter'
  ].reduce((obj, method) => {
    obj[method] = function(...args) {
      dom[method].apply(null, [ this.el ].concat(args));
      return this;
    };
    return obj;
  }, {});

  html.attr = function(name, value) {
    if (value === undefined) {
      return this.el.getAttribute(name);
    }

    this.el.setAttribute(name, value);
    return this
  };

  html.find = function(selector) {
    return get(selector, this.el);
  };

  function get$1(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.substring(0, name.length + 1) === (name + '=')) {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
          break;
        }
      }
    }
    return cookieValue;
  }

  function set(name, value, expires) {
    let cookie = name + '=' + encodeURIComponent(value);

    if (expires instanceof Date) {
      cookie += ';expires=' + expires.toUTCString();
    }

    cookie += ';path=/';
    document.cookie = cookie;
  }

  function remove$1(name) {
    set(name, '', new Date(0));
  }

  var cookie = {
    get: get$1, set, remove: remove$1
  };

  const LOG_LEVEL = {
    NONE: 0,
    ALERT: 1,
    CRITICAL: 2,
    ERROR: 3,
    WARNING: 4,
    NOTICE: 5,
    INFO: 6,
    DEBUG: 7,
    ALL: 255
  };

  const log = {
    log: function(level, ...args) {
      if (level > this.logLevel) {
        return;
      }

      if (this.logName) {
        args.unshift(`%c${this.logName} %s`, 'color:#666;');
      }

      console[level === 1 ? 'error' : 'log'].apply(console, args);
    }
  };

  function indexOfHandler(handlers, h) {
    let i = handlers.length;

    while (i--) {
      const hh = handlers[i];
      if (hh.h === h.h) {
        if ((hh.c && hh.c === h.c) || (h.c && h.c === hh.c) || (!hh.c && !h.c)) {
          return i;
        }
      }
    }

    return -1;
  }

  var events = {
    on: function(event, handler, context) {
      const h = {
        h: handler
      };

      if (context) {
        h.c = context;
      }

      let handlers = this.events[event];
      if (!handlers) {
        handlers = this.events[event] = [];
      }

      if (indexOfHandler(handlers, h) === -1) {
        handlers.push(h);
      }

      this.log && this.log(LOG_LEVEL.INFO, h.once ? 'once' : 'on', event);
      return this;
    },

    off: function(event, handler, context) {
      this.log && this.log(LOG_LEVEL.INFO, 'off', event);

      const handlers = this.events[event];
      if (!handlers) {
        return this;
      }

      const h = {
        h: handler
      };

      if (context) {
        h.c = context;
      }

      const index = indexOfHandler(handlers, h);
      if (index !== -1) {
        handlers.splice(index, 1);
      }

      if (handlers.length === 0) {
        delete this.events[event];
      }

      return this;
    },

    once: function(event, handler, context) {
      const once = (...args) => {
        this.off(event, once);
        handler.apply(context, args);
      };

      this.on(event, once);
      return this;
    },

    emit: function(event, ...args) {
      this.log && this.log(LOG_LEVEL.INFO, 'emit', event, ...args);
      const handlers = this.events[event];
      if (!handlers || !handlers.length) {
        return this;
      }

      handlers.slice().forEach(ctx => {
        ctx.h.apply(ctx.c, args);
      });
      return this;
    }
  };

  const history_ = window.history;
  const location_ = window.location;

  const rxTrailingSlash = /\/$/;
  function getLocationWithHash() {
    let loc = location_.pathname;
    const hash = location_.hash;

    if (hash) {
      loc = loc.replace(rxTrailingSlash, '') + '/' + hash;
    }

    return loc;
  }

  const Historian = function(cb) {
    this.cb = cb;
    this.url = getLocationWithHash();
    this.prevState = {};

    this.onPopState = on(window, 'popstate', e => {
      const loc = getLocationWithHash();
      if (this.url !== loc) {
        this.url = loc;
        this.cb(this.url, e.state);
      }
    });
  };

  Historian.prototype = {
    getState: function() {
      return {
        url: this.url,
        state: history_.state
      };
    },

    pushState: function(state, url) {
      if (this.url !== url) {
        this.prevState = this.getState();
        this.url = url;
        history_.pushState(state, null, url);
        this.cb(url, state);
      }
    },

    replaceState: function(state, url) {
      if (this.url !== url) {
        history_.replaceState(state, null, url);
        this.url = url;
      }
    },

    back: function(replace) {
      if (replace) {
        this.replaceState(this.prevState.state, this.prevState.url);
      } else {
        history_.back();
      }
    },

    remove: function() {
      off(window, 'popstate', this.onPopState);
    }
  };

  const makeObject = (arr, names) => arr.reduce((a, b, i) => {
    if (b) {
      a[names[i]] = b;
    }
    return a;
  }, {});

  const rxOptionalParam = /\((.*?)\)/g;
  const rxNamedParam = /(\(\?)?:\w+/g;
  const rxSplatParam = /\*\w+/g;
  const rxEscapeRegExp = /[-{}\[\]+?.,\\\^$|#\s]/g;

  const Router = function(onRoute) {
    this.onRoute = onRoute;
    this.counter = 0;
    this.routes = {};
    this.route = [];
    this.historian = new Historian((url, state) => this.check(url, state));
  };

  Router.prototype = {
    add: function(name, rx) {
      const names = [];
      rx = rx
        .replace(rxEscapeRegExp, '\\$&')
        .replace(rxOptionalParam, '(?:$1)?')
        .replace(rxNamedParam, (match, optional) => {
          !optional && names.push(match.substr(1));
          return optional ? match : '([^/?]+)';
        })
        .replace(rxSplatParam, '([^?]*?)');

      this.routes[name] = new RegExp('^' + rx);
      this.routes[name].names = names;
      return this;
    },

    delete: function(name) {
      delete this.routes[name];
      return this;
    },

    check: function(url, state) {
      const routes = this.routes;
      this.counter++;
      for (const r in routes) {
        const rx = routes[r];
        if (rx.test(url)) {
          const urlOpts = Object.assign(
            makeObject(rx.exec(url).slice(1), rx.names),
            state
          );

          this.route = [ r, urlOpts ];
          this.onRoute(r, urlOpts);
          return;
        }
      }
    },

    start: function() {
      this.check(this.historian.url);
    },

    get: function() {
      return this.historian.getState();
    },

    go: function(url, state) {
      if (url[0] === '!') {
        url = url.substr(1);
        if (this.get().url === url) {
          return this.check(url, { force: true })
        }
      }
      this.historian.pushState(state, url);
    },

    replace: function(url, state) {
      this.historian.replaceState(state, url);
    },

    back: function(path, replace) {
      if (this.counter > 1) {
        this.historian.back(replace);
      } else {
        this.go(path);
      }
    },

    remove: function() {
      this.historian.remove();
    }
  };

  const storageWrapper = storage => {
    try {
      const key = '__test__';
      storage.setItem(key, key);
      storage.removeItem(key);
      return storage
    } catch (e) {
      let cache = {};
      return {
        getItem(key) {
          return cache[key]
        },
        setItem(key, val) {
          cache[key] = val;
        },
        removeItem(key) {
          delete cache[key];
        },
        clear() {
          cache = {};
        }
      }
    }
  };

  const localStorage = storageWrapper(window.localStorage);
  const sessionStorage = storageWrapper(window.sessionStorage);

  const JSONStorage = storage => ({
    get(key) {
      const str = storage.getItem(key);
      try {
        return JSON.parse(str)
      } catch (e) {
        return null
      }
    },

    set(key, obj) {
      const str = JSON.stringify(obj);
      storage.setItem(key, str);
    },

    remove(key) {
      storage.removeItem(key);
    }
  });

  const App = function() {
    this.events = {};
    this.state = {};
    this.router = new Router((name, params) => {
      this.emit(`app.route.${name}`, params);
      this.emit('app.route', name, params);
    });
  };

  App.prototype = compose(
    html,
    events,
    log,
    {
      logName: 'app',
      logLevel: LOG_LEVEL.NONE,

      storage: JSONStorage(localStorage),
      cookie: cookie,

      init: function(settings = {}, cb) {
        if (settings.logLevel) {
          this.logLevel = settings.logLevel;
        }

        if (settings.logName) {
          this.logName = settings.logName;
        }

        this.container(settings.container);

        if (this.api) {
          this.api.init(() => this.didInit(cb));
        } else {
          this.didInit(cb);
        }

        return this;
      },

      didInit: function(cb) {
        setTimeout(() => {
          cb && cb();
          this.emit('app.ready');
        }, 0);
      },

      setAPI: function(api) {
        this.api = api;
        this.call = (...args) => api.call(...args);
        this.host = () => api.host;
        api.log = (...args) => this.log(...args);
        api.emit = (...args) => this.emit(...args);
        api.setApp(this);
        return this;
      },

      routes: function(routes) {
        for (const route in routes) {
          this.router.add(route, routes[route]);
        }
        return this;
      },

      start: function() {
        this.router.start();
      },

      go: function(...args) {
        this.router.go(...args);
      },

      container: function(container) {
        if (typeof container === 'string') {
          const el = get(container);
          // if it is HTMLCollection or NodeList;
          this.el = el.forEach ? el.item(0) : el;
        } else {
          this.el = container;
        }

        const router = this.router;
        this.onclick = on(this.el, 'click', '[soft]', function(e) {
          e.preventDefault();
          router.go(this.pathname);
        });
      },

      remove: function() {
        off(this.el, 'click', this.onclick);
        delete this.el;
        this.router.remove();
      }
    }
  );

  var app = new App();

  function parallel(tasks, done) {
    const results = [];
    let counter = 0;
    tasks.forEach((callback, index) => {
      callback((...args) => {
        results[index] = args;
        counter++;
        if (counter === tasks.length) {
          done(results);
        }
      });
    });
  }

  const Views = function(opts) {
    this.views = {};
    this.states = {};
    this.active = undefined;
    this.rootEl = opts.rootEl || document.documentElement;
    this.rootPath = opts.rootPath || '';
    this.onChange = opts.onChange;
    this.el = opts.el || create('div.views');

    opts.routes.forEach(route => {
      const name = route[0];
      app.router.add(name, route[1]);
      this.views[name] = route.slice(2).map(View => {
        const view = new View();
        this.el.appendChild(view.el);
        return view;
      });
    });

    app.on('app.route', (name, opts) => this.state(name, opts));
  };

  Views.prototype = compose(
    html,
    {
      state: function(name, opts) {
        const views = this.views[name];

        if (!views) {
          return;
        }

        let view;
        if (views.length > 1) {
          view = app.isAuthenticated && app.isAuthenticated() ? views[1] : views[0];
        } else {
          view = views[0];
        }

        if (this.active === view && opts && opts.force) {
          return view.forcedState(opts);
        }

        view.state(opts, (err, newstate) => {
          if (err) {
            this.active = undefined;
            return this.onChange && this.onChange(err, view);
          }

          if (newstate !== undefined) {
            app.router.replace(this.rootPath + newstate);
            this.states[name] = newstate;
          }
          this.change(view);
        });
      },

      change: function(view) {
        const actions = [];

        if (this.active !== view) {
          if (this.active && this.active.willClose) {
            actions.push(cb => this.active.willClose(cb));
          }

          view.willOpen && actions.push(cb => view.willOpen(cb));

          if (actions.length) {
            parallel(actions, () => this._change(view, true));
          } else {
            this._change(view, true);
          }
        } else {
          this._change(view);
        }
      },

      _change: function(view, update) {
        if (update) {
          this.active && this.close(this.active);
          this.open(view);
        }

        if (view !== this.active) {
          this.active = view;
          this.onChange && this.onChange(null, view);
        }
      },

      open: function(view) {
        view.el.classList.add('active');
        this.rootEl.classList.add(`active-view-${view.name}`);
        window.scrollTo(0, 0);
        app.emit('app.view', view);
        view.didOpen && setTimeout(() => view.didOpen(), 0);
      },

      close: function(view) {
        view.el.classList.remove('active');
        this.rootEl.classList.remove(`active-view-${view.name}`);
        view.didClose && setTimeout(() => view.didClose(), 0);
      },

      remove: function() {
        for (const name in this.views) {
          app.router.remove(name);
          this.views[name].forEach(view => view.remove && view.remove());
        }

        this.el.remove();
      }
    }
  );

  // define views classes
  const Post = function() {
    this.el = create('div.view.view-post', '<a soft href="/">Index</a>');
  };
  Post.prototype = {
    name: 'post',
    state: function(state, cb) {
      console.log('post state', state);
      cb();
    }
  };

  const Page = function() {
    this.el = create('div.view.view-page', `
    <a soft href="/">Index</a><br>
    <a soft href="/page">Page</a><br>
    <a soft href="/post/test-post">Post</a><br>
  `);
  };
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
  };

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

}());
