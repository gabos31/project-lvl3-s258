import axios from 'axios';
import _ from 'lodash';
import isURL from 'validator/lib/isURL';

export default () => {
  const feedObj = {};
  const articlesList = [];
  const proxy = 'https://cors-anywhere.herokuapp.com/';
  const inputFeed = document.getElementById('inputFeed');
  const inputForm = document.getElementById('inputForm');

  const makeFeedList = ({ data }, feedUrl) => {
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
      axios.get(`${proxy}${feedUrl}`)
        .then(response => makeFeedList(response, feedUrl))
        .then(doc => makeArticlesList(doc));
    }
  });
};
