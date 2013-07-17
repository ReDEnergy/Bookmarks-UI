/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
'use strict';

const { WindowTracker } = require('sdk/deprecated/window-utils');
const { isXULBrowser } = require('sdk/window/utils');
const { add, remove } = require('sdk/util/array');
const { getTabs, closeTab, getURI } = require('sdk/tabs/utils');
const { data } = require('sdk/self');

const addonURL = "about:bookmarks-ui";

WindowTracker({
  onTrack: function onTrack(window) {
    if (isXULBrowser(window))
      add(window.XULBrowserWindow.inContentWhitelist, addonURL);
  },
  onUntrack: function onUntrack(window) {
    if (isXULBrowser(window))
      getTabs(window).filter(tabFilter).forEach(untrackTab.bind(null, window));
  }
});

function tabFilter(tab) {
  return getURI(tab) === addonURL;
}

function untrackTab(window, tab) {
  // Note: `onUntrack` will be called for all windows on add-on unloads,
  // so we want to clean them up from these URLs.
  remove(window.XULBrowserWindow.inContentWhitelist, addonURL);
  closeTab(tab);
}
