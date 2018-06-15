import $ from 'jquery';

const activateForm = () => {
  const inputFeed = document.getElementById('inputFeed');
  const submitBtn = document.getElementById('submitBtn');
  inputFeed.removeAttribute('readonly');
  submitBtn.disabled = false;
};

const makeAlert = (type, text) => {
  $('.alert').remove(this);
  const root = document.getElementById('mainAlert');
  const alert = document.createElement('div');
  alert.innerHTML = `<div class="alert alert-${type} alert-dismissible fade show" role="alert">
      ${text}
      <button type="button" class="close" data-dismiss="alert" aria-label="Close">
        <span aria-hidden="true">&times;</span>
      </button>
    </div>`;
  root.prepend(alert);
};

const manageLoadingState = ({ status, statusText, data }) => {
  activateForm();
  if (status !== 200) {
    throw new Error(statusText);
  } else {
    makeAlert('success', 'RSS-Feed and articles added!');
    $('[hidden]').removeAttr('hidden');
  }
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

const updateArticlesList = ({ articleLinks, articleTitles, articleDescriptions }) => {
  $('#articlesList').empty();
  const articlesUl = document.getElementById('articlesList');
  articleLinks.forEach((link, i) => {
    const a = document.createElement('a');
    const title = articleTitles[i] || articleDescriptions[i].split('<')[0];
    a.href = link;
    a.textContent = `  ${title}`;
    const button = document.createElement('button');
    const description = !articleDescriptions[i] || articleDescriptions[i][0] === '<' ?
      'This article does not have a description' : articleDescriptions[i].split('<')[0];
    button.classList.add('btn', 'btn-outline-secondary', 'btn-sm');
    button.textContent = '...';
    button.type = 'button';
    button.setAttribute('data-toggle', 'modal');
    button.setAttribute('data-target', '#modalDescription');
    button.setAttribute('data-title', title);
    button.setAttribute('data-description', description);
    button.setAttribute('data-link', link);
    const li = document.createElement('li');
    li.append(button);
    li.append(a);
    articlesUl.prepend(li);
  });
};

const launchDownloading = () => {
  const submitBtn = document.getElementById('submitBtn');
  const inputFeed = document.getElementById('inputFeed');
  submitBtn.disabled = true;
  inputFeed.setAttribute('readonly', '');
  makeAlert('info', 'Loading...');
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
  if ($('tr').length < 2) {
    $('[for="feedTable"]').attr('hidden', '');
    $('[for="articlesList"]').attr('hidden', '');
    $('#feedTable').attr('hidden', '');
  }
  activateForm();
  makeAlert('danger', err);
};

export default {
  manageLoadingState,
  makeFeedList,
  updateArticlesList,
  launchDownloading,
  showModalHandler,
  hideModalHandler,
  inputUrlHandler,
  processErrors,
};
