'use babel';

import IncreidleNewsView from './increidle-news-view';
import { CompositeDisposable, Disposable } from 'atom';

export default {

  increidleNewsView: null,
  subscriptions: null,
  test: true,

  activate(state) {
    this.subscriptions = new CompositeDisposable(
      // Add an opener for our view.
      atom.workspace.addOpener(uri => {
        if (uri === 'atom://increidle-news') {
          console.log("hola " + this.news);
          return new IncreidleNewsView({test: this.test, ...state});
        }
      }),

      // Register command that toggles this view
      atom.commands.add('atom-workspace', {
        'increidle-news:toggle': () => this.toggle()
      }),

      // Destroy any ActiveEditorInfoViews when the package is deactivated.
      new Disposable(() => {
        atom.workspace.getPaneItems().forEach(item => {
          if (item instanceof IncreidleNewsView) {
            item.destroy();
          }
        });
      })
    );
  },

  deactivate() {
    this.subscriptions.dispose();
  },

  toggle() {
    console.log('IncreidleNews was toggled!');
    atom.workspace.toggle('atom://increidle-news');
  },

  deserializeIncreidleNewsView(serialized) {
    return new IncreidleNewsView({test: this.test, ...serialized});
  },

};
