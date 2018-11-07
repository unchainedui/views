import app from 'uc-app';
import compose from 'uc-compose';
import { parallel } from 'uc-flow';
import { create } from 'uc-dom';
import html from 'uc-dom/methods';

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
  })

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
        view = app.isAuthenticated({ view: name }) ? views[1] : views[0];
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
        this.views[name].forEach(view => view.remove && view.remove())
      }

      this.el.remove();
    }
  }
)

export default Views;
