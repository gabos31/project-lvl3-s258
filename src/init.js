import axios from 'axios';
import _ from 'lodash';
import isURL from 'validator/lib/isURL';
import $ from 'jquery';

export default () => {
  const state = {};
  state.feeds = {};
  state.articlesList = [];
  const proxy = 'https://cors-anywhere.herokuapp.com/';
  const inputFeed = document.getElementById('inputFeed');
  const inputForm = document.getElementById('inputForm');
  const mainAlert = document.getElementById('mainAlert');
  const submitBtn = document.getElementById('submitBtn');

  const timeout = time => setTimeout(() => {
    mainAlert.className = '';
    mainAlert.textContent = '';
  }, time);

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
    timeout(2000);
    return data;
  };

  const checkUrl = (url) => {
    if (url === '') {
      state.checkUrlResult = null;
    } else {
      state.checkUrlResult = (isURL(url) && !_.has(state.feeds, url));
    }
  };

  const parseRss = (data, url) => {
    const parser = new DOMParser();
    const parsedRss = parser.parseFromString(data, 'application/xml');
    if (parsedRss.doctype !== null) {
      throw new Error('This page does not contain rss.');
    }
    state.feeds[url] = parsedRss;
  };

  const makeFeedList = (url) => {
    const doc = state.feeds[url];
    const title = doc.querySelector('channel > title').textContent;
    const description = doc.querySelector('channel > description').textContent;
    const feedTable = document.getElementById('feedTable');
    const tr = feedTable.insertRow();
    const tdTitle = tr.insertCell();
    tdTitle.textContent = title;
    const tdDescription = tr.insertCell();
    tdDescription.textContent = description;
    inputFeed.value = '';
    inputFeed.classList.remove('is-valid');
  };

  const makeArticlesList = (url) => {
    const doc = state.feeds[url];
    const articlesUl = document.getElementById('articlesList');
    const itemsColl = doc.querySelectorAll('item');
    itemsColl.forEach(item => state.articlesList.push(item));
    state.articlesList.forEach((item) => {
      const a = document.createElement('a');
      const link = item.querySelector('link').textContent;
      a.href = link;
      const title = item.querySelector('title');
      const description = item.querySelector('description');
      const textForLink = `  ${title.textContent || description.textContent.split('<')[0]}`;
      a.textContent = textForLink;
      const textForModal = description === null || description.textContent[0] === '<' ?
        'This article does not have a description' : description.textContent.split('<')[0];
      const li = document.createElement('li');
      const button = document.createElement('button');
      button.classList.add('btn', 'btn-outline-secondary', 'btn-sm');
      button.textContent = '...';
      button.type = 'button';
      button.setAttribute('data-toggle', 'modal');
      button.setAttribute('data-target', '#modalDescription');
      button.setAttribute('data-title', textForLink.trim());
      button.setAttribute('data-description', textForModal);
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
  });

  inputFeed.addEventListener('input', () => {
    checkUrl(inputFeed.value);
    switch (state.checkUrlResult) {
      case null:
        inputFeed.className = 'form-control';
        break;
      case false:
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
    if (state.checkUrlResult === true) {
      const feedUrl = inputFeed.value;
      launchDownloading();
      axios.get(`${proxy}${feedUrl}`)
        .then(response => manageLoadingState(response))
        .then(data => parseRss(data, feedUrl))
        .then(() => makeFeedList(feedUrl))
        .then(() => makeArticlesList(feedUrl))
        .catch((err) => {
          console.log(err);
          activateForm();
          mainAlert.classList.add('alert-danger');
          mainAlert.textContent = err;
          timeout(4000);
        });
    }
  });
};
