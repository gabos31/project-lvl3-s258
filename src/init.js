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
    articlesData: {
      articleLinks: [],
      articleTitles: [],
      articleDescriptions: [],
    },
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
    const {
      feedTitle,
      feedDescription,
      articleLinks,
      articleTitles,
      articleDescriptions,
    } = parsedRss;
    state.feeds[url] = { feedTitle, feedDescription };
    state.articlesData.articleLinks.push(...articleLinks);
    state.articlesData.articleTitles.push(...articleTitles);
    state.articlesData.articleDescriptions.push(...articleDescriptions);
  };

  const proxy = 'https://cors-anywhere.herokuapp.com/';

  const makeUnionList = (rssDataArr, name) => {
    const oldList = state.articlesData[name];
    const newList = _.flatten(rssDataArr.map(rssData =>
      rssData[name]));
    return _.union(oldList, newList);
  };

  const updateArticlesData = (newArticlesData) => {
    state.articlesData = newArticlesData;
  };

  const updateArticles = async () => {
    const feedLinks = _.keys(state.feeds);
    const promisesArr = feedLinks.map(link => axios.get(`${proxy}${link}`));
    try {
      const responses = await Promise.all(promisesArr);
      const rssDataArr = responses.map(({ data }) => parseRss(data));
      const newArticlesData = {
        articleLinks: makeUnionList(rssDataArr, 'articleLinks'),
        articleTitles: makeUnionList(rssDataArr, 'articleTitles'),
        articleDescriptions: makeUnionList(rssDataArr, 'articleDescriptions'),
      };
      updateArticlesData(newArticlesData);
      renderers.updateArticlesList(state.articlesData);
      setTimeout(() => updateArticles(), 5000);
    } catch (error) {
      renderers.processErrors(error);
    }
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
  inputForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (state.checkUrlResult === 'valid') {
      const feedUrl = state.url;
      renderers.launchDownloading();
      try {
        const response = await axios.get(`${proxy}${feedUrl}`);
        const data = renderers.manageLoadingState(response);
        const rssData = parseRss(data);
        saveRss(rssData, feedUrl);
        renderers.makeFeedList(state.feeds, feedUrl);
        renderers.updateArticlesList(state.articlesData);
      } catch (error) {
        renderers.processErrors(error);
      }
    }
  });

  const checkFeeds = () => {
    if (!_.isEmpty(_.keys(state.feeds))) {
      setTimeout(() => updateArticles(), 5000);
    } else {
      setTimeout(() => checkFeeds(), 1000);
    }
  };

  checkFeeds();
};
