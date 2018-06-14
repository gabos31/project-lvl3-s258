import axios from 'axios';
import _ from 'lodash';
import isURL from 'validator/lib/isURL';
import $ from 'jquery';

export default () => {
  const state = {
    checkUrlResult: 'empty',
    feeds: {},
    articlesList: [],
  };
  const proxy = 'https://cors-anywhere.herokuapp.com/';
  const inputFeed = document.getElementById('inputFeed');
  const inputForm = document.getElementById('inputForm');
  const mainAlert = document.getElementById('mainAlert');
  const submitBtn = document.getElementById('submitBtn');

  const activateForm = () => {
    inputFeed.removeAttribute('readonly');
    submitBtn.disabled = false;
  };

  const manageLoadingState = ({ status, statusText, data }) => {
    activateForm();
    if (status !== 200) {
      throw new Error(statusText);
    } else {
      mainAlert.classList.replace('alert-primary', 'alert-success');
      mainAlert.textContent = 'RSS-Feed and articles added!';
    }
    setTimeout(() => {
      mainAlert.className = '';
      mainAlert.textContent = '';
    }, 2000);
    return data;
  };

  const checkUrl = (url) => {
    if (url === '') {
      state.checkUrlResult = 'empty';
    } else if (isURL(url) && !_.has(state.feeds, url)) {
      state.checkUrlResult = 'valid';
    } else {
      state.checkUrlResult = 'invalid';
    }
  };

  const parseRss = (data) => {
    const parser = new DOMParser();
    const parsedRss = parser.parseFromString(data, 'application/xml');
    if (parsedRss.doctype !== null) {
      throw new Error('This page does not contain rss.');
    }
    return parsedRss;
  };

  const extractRssElements = (parsedRss) => {
    const feedTitleElm = parsedRss.querySelector('channel > title');
    const feedDescriptionElm = parsedRss.querySelector('channel > description');
    const articleLinksColl = parsedRss.querySelectorAll('item > link');
    const articleTitlesColl = parsedRss.querySelectorAll('item > title');
    const articleDescriptionsColl = parsedRss.querySelectorAll('item > description');
    return {
      feedTitleElm,
      feedDescriptionElm,
      articleLinksColl,
      articleTitlesColl,
      articleDescriptionsColl,
    };
  };

  const extractRssData = ({
    feedTitleElm,
    feedDescriptionElm,
    articleLinksColl,
    articleTitlesColl,
    articleDescriptionsColl,
  }) => {
    const feedTitle = feedTitleElm.textContent;
    const feedDescription = feedDescriptionElm.textContent;
    const articleLinks = [];
    const articleTitles = [];
    const articleDescriptions = [];
    articleLinksColl.forEach(link => articleLinks.push(link.textContent));
    articleTitlesColl.forEach((title, i) => articleTitles.push(title.textContent ||
      articleDescriptionsColl.item(i).textContent.split('<')[0]));
    articleDescriptionsColl.forEach(description =>
      articleDescriptions.push(description === null || description.textContent[0] === '<' ?
        'This article does not have a description' : description.textContent.split('<')[0]));
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

  const makeFeedList = (url) => {
    const { feedTitle, feedDescription } = state.feeds[url];
    const feedTable = document.getElementById('feedTable');
    const tr = feedTable.insertRow();
    const tdTitle = tr.insertCell();
    tdTitle.textContent = feedTitle;
    const tdDescription = tr.insertCell();
    tdDescription.textContent = feedDescription;
    inputFeed.value = '';
    inputFeed.classList.remove('is-valid');
  };

  const makeArticlesList = (url) => {
    const { articleLinks, articleTitles, articleDescriptions } = state.feeds[url];
    const articlesUl = document.getElementById('articlesList');
    articleLinks.forEach((link, i) => {
      const a = document.createElement('a');
      a.href = link;
      const title = articleTitles[i];
      const description = articleDescriptions[i];
      a.textContent = `  ${title}`;
      const li = document.createElement('li');
      const button = document.createElement('button');
      button.classList.add('btn', 'btn-outline-secondary', 'btn-sm');
      button.textContent = '...';
      button.type = 'button';
      button.setAttribute('data-toggle', 'modal');
      button.setAttribute('data-target', '#modalDescription');
      button.setAttribute('data-title', title);
      button.setAttribute('data-description', description);
      button.setAttribute('data-link', link);
      li.append(button);
      li.append(a);
      articlesUl.append(li);
    });
  };

  const launchDownloading = () => {
    submitBtn.disabled = true;
    inputFeed.setAttribute('readonly', '');
    mainAlert.classList.remove('alert-danger');
    mainAlert.classList.add('alert', 'alert-primary');
    mainAlert.textContent = 'Loading...';
  };

  $('#modalDescription').on('show.bs.modal', (e) => {
    const button = $(e.relatedTarget);
    const title = button.data('title');
    const description = button.data('description');
    const link = button.data('link');
    const modalLabel = $('#modalLabel');
    modalLabel.text(title);
    const pDescr = $('#pDescr');
    pDescr.text(description);
    const modalLink = $('#modalLink');
    modalLink.attr('href', link);
  }).on('hide.bs.modal', () => {
    const buttons = $('li > button');
    buttons.css('box-shadow', 'none');
  });

  inputFeed.addEventListener('input', () => {
    checkUrl(inputFeed.value);
    switch (state.checkUrlResult) {
      case 'empty':
        inputFeed.className = 'form-control';
        break;
      case 'invalid':
        inputFeed.classList.remove('is-valid');
        inputFeed.classList.add('is-invalid');
        break;
      default:
        inputFeed.classList.remove('is-invalid');
        inputFeed.classList.add('is-valid');
        break;
    }
  });

  inputForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (state.checkUrlResult === 'valid') {
      const feedUrl = inputFeed.value;
      launchDownloading();
      axios.get(`${proxy}${feedUrl}`)
        .then(response => manageLoadingState(response))
        .then(data => parseRss(data))
        .then(parsedRss => extractRssElements(parsedRss))
        .then(rssElements => extractRssData(rssElements))
        .then(rssData => saveRss(rssData, feedUrl))
        .then(() => makeFeedList(feedUrl))
        .then(() => makeArticlesList(feedUrl))
        .catch((err) => {
          console.log(err);
          activateForm();
          mainAlert.classList.add('alert-danger');
          mainAlert.textContent = err;
          setTimeout(() => {
            mainAlert.className = '';
            mainAlert.textContent = '';
          }, 4000);
        });
    }
  });
};
