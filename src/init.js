import axios from 'axios';
import _ from 'lodash';
import isURL from 'validator/lib/isURL';

export default () => {
  const feedObj = {};
  const articlesList = [];
  const proxy = 'https://cors-anywhere.herokuapp.com/';
  const inputFeed = document.getElementById('inputFeed');
  const inputForm = document.getElementById('inputForm');
  const mainAlert = document.getElementById('mainAlert');

  const timeout = time => setTimeout(() => {
    mainAlert.className = '';
    mainAlert.textContent = '';
  }, time);

  const makeAlert = ({ status, statusText, data }) => {
    if (status !== 200) {
      mainAlert.classList.replace('alert-primary', 'alert-danger');
      mainAlert.textContent = `Error, ${statusText}`;
    } else {
      mainAlert.classList.replace('alert-primary', 'alert-success');
      mainAlert.textContent = 'RSS-Feed and articles added!';
      timeout(4000);
    }
    return data;
  };

  const makeFeedList = (data, feedUrl) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(data, 'application/xml');
    const title = doc.querySelector('channel > title').textContent;
    const description = doc.querySelector('channel > description').textContent;
    feedObj[feedUrl] = { title, description };
    const feedTable = document.getElementById('feedTable');
    const tr = feedTable.insertRow();
    const tdTitle = tr.insertCell();
    tdTitle.textContent = feedObj[feedUrl].title;
    const tdDescription = tr.insertCell();
    tdDescription.textContent = feedObj[feedUrl].description;
    inputFeed.value = '';
    inputFeed.classList.remove('is-valid');
    return doc;
  };

  const makeArticlesList = (doc) => {
    const articlesUl = document.getElementById('articlesList');
    const titleColl = doc.querySelectorAll('item > title');
    const linksColl = doc.querySelectorAll('item > link');
    linksColl.forEach((link, i) => {
      const a = document.createElement('a');
      a.href = link.textContent;
      a.textContent = titleColl.item(i).textContent;
      articlesList.push(a);
    });
    articlesList.forEach((a) => {
      const li = document.createElement('li');
      li.append(a);
      articlesUl.append(li);
    });
  };

  inputFeed.addEventListener('input', () => {
    if (!isURL(inputFeed.value) || _.has(feedObj, inputFeed.value)) {
      inputFeed.classList.remove('is-valid');
      inputFeed.classList.add('is-invalid');
    } else {
      inputFeed.classList.remove('is-invalid');
      inputFeed.classList.add('is-valid');
    }
  });

  inputForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const feedUrl = inputFeed.value;
    if (!inputFeed.classList.contains('is-valid') || _.has(feedObj, feedUrl)) {
      e.stopPropagation();
      inputFeed.classList.add('is-invalid');
    } else {
      mainAlert.classList.remove('alert-danger');
      mainAlert.classList.add('alert', 'alert-primary');
      mainAlert.textContent = 'Loading...';
      axios.get(`${proxy}${feedUrl}`)
        .then(response => makeAlert(response))
        .then(data => makeFeedList(data, feedUrl))
        .then(doc => makeArticlesList(doc))
        .catch((err) => {
          mainAlert.classList.add('alert-danger');
          mainAlert.textContent = err;
          timeout(4000);
        });
    }
  });
};
