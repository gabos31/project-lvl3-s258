import $ from 'jquery';

const activateForm = () => {
  const inputFeed = document.getElementById('inputFeed');
  const submitBtn = document.getElementById('submitBtn');
  inputFeed.removeAttribute('readonly');
  submitBtn.disabled = false;
};

const manageLoadingState = ({ status, statusText, data }) => {
  const mainAlert = document.getElementById('mainAlert');
  activateForm();
  if (status !== 200) {
    throw new Error(statusText);
  } else {
    mainAlert.classList.replace('alert-primary', 'alert-success');
    mainAlert.textContent = 'RSS-Feed and articles added!';
    $('[hidden]').removeAttr('hidden');
  }
  setTimeout(() => {
    mainAlert.className = '';
    mainAlert.textContent = '';
  }, 2000);
  return data;
};

const makeFeedList = (feeds, url) => {
  const { feedTitle, feedDescription } = feeds[url];
  const feedTable = document.getElementById('feedTable');
  const tr = feedTable.insertRow();
  const tdTitle = tr.insertCell();
  tdTitle.textContent = feedTitle;
  const tdDescription = tr.insertCell();
  tdDescription.textContent = feedDescription;
  const inputFeed = document.getElementById('inputFeed');
  inputFeed.value = '';
  inputFeed.classList.remove('is-valid');
};

const makeArticlesList = (feeds, url) => {
  const { articleLinks, articleTitles, articleDescriptions } = feeds[url];
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
  const mainAlert = document.getElementById('mainAlert');
  const submitBtn = document.getElementById('submitBtn');
  const inputFeed = document.getElementById('inputFeed');
  submitBtn.disabled = true;
  inputFeed.setAttribute('readonly', '');
  mainAlert.classList.remove('alert-danger');
  mainAlert.classList.add('alert', 'alert-primary');
  mainAlert.textContent = 'Loading...';
};

const showModalHandler = (e) => {
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
};

const hideModalHandler = () =>
  $('li > button').css('box-shadow', 'none');

const inputUrlHandler = (checkUrlResult) => {
  const inputFeed = document.getElementById('inputFeed');
  switch (checkUrlResult) {
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
};

const processErrors = (err) => {
  console.log(err);
  const mainAlert = document.getElementById('mainAlert');
  activateForm();
  mainAlert.classList.add('alert-danger');
  mainAlert.textContent = err;
  setTimeout(() => {
    mainAlert.className = '';
    mainAlert.textContent = '';
  }, 4000);
};

export default {
  activateForm,
  manageLoadingState,
  makeFeedList,
  makeArticlesList,
  launchDownloading,
  showModalHandler,
  hideModalHandler,
  inputUrlHandler,
  processErrors,
};
