import axios from 'axios';
import _ from 'lodash';
import isURL from 'validator/lib/isURL';
import $ from 'jquery';
import renderers from './renderers';

export default () => {
  const state = {
    checkUrlResult: 'empty',
    url: '',
    feeds: {},
    articlesList: [],
  };

  const checkUrl = (url) => {
    if (url === '') {
      return 'empty';
    } else if (isURL(url) && !_.has(state.feeds, url)) {
      return 'valid';
    }
    return 'invalid';
  };

  const saveCheckUrlResult = (result) => {
    state.checkUrlResult = result;
  };

  const parseRss = (data) => {
    const parser = new DOMParser();
    const parsedRss = parser.parseFromString(data, 'application/xml');
    console.log(parsedRss);
    if (parsedRss.doctype !== null) {
      throw new Error('This page does not contain rss.');
    }
    const feedTitle = parsedRss.querySelector('channel > title').textContent;
    const feedDescription = parsedRss.querySelector('channel > description').textContent;
    const articleLinksColl = parsedRss.querySelectorAll('item > link');
    const articleTitlesColl = parsedRss.querySelectorAll('item > title');
    const articleDescriptionsColl = parsedRss.querySelectorAll('item > description');
    const articleLinks = [];
    const articleTitles = [];
    const articleDescriptions = [];
    articleLinksColl.forEach(link => articleLinks.push(link.textContent));
    articleTitlesColl.forEach(title => articleTitles.push(title.textContent));
    articleDescriptionsColl.forEach(description =>
      articleDescriptions.push(description.textContent));
    return {
      feedTitle,
      feedDescription,
      articleLinks,
      articleTitles,
      articleDescriptions,
    };
  };

  const saveRss = (parsedRss, url) => {
    state.feeds[url] = parsedRss;
  };

  $('#modalDescription')
    .on('show.bs.modal', renderers.showModalHandler)
    .on('hide.bs.modal', renderers.hideModalHandler);

  const inputFeed = document.getElementById('inputFeed');
  inputFeed.addEventListener('input', () => {
    const url = inputFeed.value;
    const checkUrlResult = checkUrl(url);
    saveCheckUrlResult(checkUrlResult);
    renderers.inputUrlHandler(state.checkUrlResult);
    if (state.checkUrlResult === 'valid') {
      state.url = url;
    }
  });

  const inputForm = document.getElementById('inputForm');
  inputForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (state.checkUrlResult === 'valid') {
      const feedUrl = state.url;
      renderers.launchDownloading();
      const proxy = 'https://cors-anywhere.herokuapp.com/';
      axios.get(`${proxy}${feedUrl}`)
        .then(response => renderers.manageLoadingState(response))
        .then(data => parseRss(data))
        .then(parsedRss => saveRss(parsedRss, feedUrl))
        .then(() => renderers.makeFeedList(state.feeds, feedUrl))
        .then(() => renderers.makeArticlesList(state.feeds, feedUrl))
        .catch(renderers.processErrors);
    }
  });
};
