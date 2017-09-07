
const adminName = document.querySelector('#admin-name').innerHTML;
const adminTable = document.querySelector('table.administrators');
const employeesTables = document.querySelector('table.employees');
const arrowsUp = document.querySelectorAll('i.fa-arrow-up');
const arrowsDown = document.querySelectorAll('button>i.fa-arrow-down');
const wrongInput = document.querySelector('div.alert.alert-danger.wrong-input');
const btnSaveChanges = document.querySelector('.btn-save-changes');
const btnUndoChanges = document.querySelector('.btn-undo-changes');
const btnAddEmployee = document.querySelector('.btn-add-employee');
const btnDelete = document.querySelector('.btn-delete');
let insideInputs = document.querySelectorAll('td > input');
const getTables = {
  administrators: getAdmins,
  employees: getEmployees
};

let idColumns = document.querySelectorAll('.id-logic');
let follower = document.querySelector('.follower');
let deleteSelected = {};
let changeSelected = {};
let checkboxes = document.querySelectorAll('input[type=checkbox]');

const patternExpressions = {
  'first_name': new RegExp(/[a-zA-Z-.]+/i),
  'last_name': new RegExp(/[a-zA-Z-.]+/i),
  'phone_number': new RegExp(/[\d\s]+/i),
  'job_name': new RegExp(/[a-zA-Z\s]+/i),
  'email': new RegExp(/[\w]+@[\w]+\.[\w]+/i),
  'salary': new RegExp(/[\d\.]+/i)
};

const addEmployeeForm = document.querySelector('#form-add-employee');
const btnSubmit = document.querySelector('.btn-add');

const PAGE_LIST_SIZE = 5;
const paginationButtons = document.querySelectorAll('ul.pager>li>a');

function getAdmins(sort = 'ASC', col = 'id') {
  $.get(`/api/administrators?${col}=${sort}`, data => {
    populateAdminTable(data);
  });
}

function getEmployees(sort = 'ASC', col = 'id') {
  $.get(`/api/employees?${col}=${sort}`, data => {
    populateEmployeesTable(data);
  });
}

function populateAdminTable(data) {
  while(adminTable.childElementCount > 1)
    adminTable.removeChild(adminTable.lastChild);
  data.rows.forEach((row, index) => {
    adminTable.innerHTML += `<tr>
      <td><span class="responsive-table-label padding-id">Id: </span>${index + 1}</td>
      <td><span class="responsive-table-label">Full name:</span>${row.name}</td>
      <td><span class="responsive-table-label">Email:</span>${row.email}</td>
      <td><span class="responsive-table-label">Registration date:</span>${row.registration_date}</td>
    </tr>`;
  });
}

function populateEmployeesTable(data) {
  while (employeesTables.childElementCount > 1)
    employeesTables.removeChild(employeesTables.lastChild);
  data.rows.forEach((row, index) => {
    employeesTables.innerHTML += `<tr>
    <td class="id-logic td-flex"><input type="checkbox" data-id="${row.id}"><span class="responsive-table-label">Delete</span><span class="id"><span class="responsive-table-label">&nbspindex </span>${index + 1}<span></td>
    <td><span class="responsive-table-label">First name: </span>${row.first_name}</td>
    <td><span class="responsive-table-label">Last name: </span>${row.last_name}</td>
    <td><span class="responsive-table-label">Phone number: </span><input data-col="phone_number" data-original="${row.phone_number}" type="text" data-id="${row.id}" value="${row.phone_number}" pattern="[\\d\\s]+"></td>
    <td><span class="responsive-table-label">Salary: </span><input data-col="salary" data-original="${row.salary}" data-id="${row.id}" type="text" value="${row.salary}" pattern="[\\d\\.]+"></td>
    <td><span class="responsive-table-label">Job: </span><input data-col="job_name" data-id="${row.id}" data-original="${row.job_name}" type="text" value="${row.job_name}" pattern="[\\w\\s]+"></td>
    <td><span class=" responsive-table-label">Email: </span><input data-col="email" data-id="${row.id}" data-original="${row.email}" type="text" value="${row.email}" pattern="[\\w]+@[\\w]+"></td>
    </tr>`;

    changeSelected[row.id] = {
      'bool': false,
      'change': ''
    };
    deleteSelected[row.id] = false;
  });
  
  insideInputs = document.querySelectorAll('td > input');
  idColumns = document.querySelectorAll('.id-logic');
  checkboxes = document.querySelectorAll('input[type=checkbox]');
  checkboxes.forEach(checkbox => checkbox.addEventListener('click', checkboxClick));
  insideInputs.forEach(input => input.addEventListener('input', textboxInput));/*
  idColumns.forEach(id => id.addEventListener('mouseenter', idMouseEnter));
  idColumns.forEach(id => id.addEventListener('mouseleave', idMouseOut));*/
}


function arrowSortAsc(i) {
  getTables[i.dataset.table]('ASC', i.dataset.col);
}

function arrowSortDesc(i) {
  getTables[i.dataset.table]('DESC', i.dataset.col);
}

function testForChanges() {
  for (let index = 0; index < insideInputs.length; index++)
    if (insideInputs[index].className.includes('text-changed'))
      return true;
  return false;
}

function toggleChangeButtons() {
  if (testForChanges()) {
    btnSaveChanges.removeAttribute('disabled');
    btnUndoChanges.removeAttribute('disabled');
    return ;
  }
  btnSaveChanges.setAttribute('disabled', 'disabled');
  btnUndoChanges.setAttribute('disabled', 'disabled');
}

function textboxInput(e) {
  const pattern = patternExpressions[this.dataset.col];
  const matchedStr = this.value.trim().match(pattern);

  this.classList.toggle('text-changed', this.value !== this.dataset.original);
  //changeSelected[this.parentNode.parentNode.firstChild.firstChild.dataset.id] += this.value != this.dataset.original? 1 : -1;
  if (!matchedStr || matchedStr[0] !== this.value) {
    wrongInput.classList.remove('hidden');
    wrongInput.innerHTML = `Invalid ${this.dataset.col.replace('_', ' ')}`;
    btnSaveChanges.setAttribute('disabled', 'disabled');
    btnUndoChanges.setAttribute('disabled', 'disabled');   
  }
  else {
    wrongInput.classList.add('hidden');
    toggleChangeButtons();

  }
}

function undoChanges(e) {
  Object.keys(changeSelected).forEach(key => {
    changeSelected[key].bool = false;
    changeSelected[key].change = '';
  });
  insideInputs.forEach(input => { 
    input.value = input.dataset.original;
    input.classList.remove('text-changed');
  });
  wrongInput.classList.add('hidden');
  btnSaveChanges.setAttribute('disabled', 'disabled');
  btnUndoChanges.setAttribute('disabled', 'disabled');
}

function addEvents() {
  btnUndoChanges.addEventListener('click', undoChanges);
  btnDelete.addEventListener('click', deleteEntries);
  btnSaveChanges.addEventListener('click', saveChanges);
  btnSubmit.addEventListener('click', submitForm);
  paginationButtons.forEach(btn => btn.addEventListener('click', paginationButtonsClick));
}

function idMouseEnter(e) {
  const limits = this.getBoundingClientRect();
  const transforms = {
    left: limits.left + window.scrollX - this.offsetHeight,
    top: limits.top + window.scrollY - this.offsetHeight * 2 + 10 - (40 - this.offsetHeight)
  };
  
  follower.classList.add('in');
  follower.style.height = follower.style.width = `${this.offsetHeight}px`
  follower.style.transform = `translate(${transforms.left}px, ${transforms.top}px)`
}

function idMouseOut(e) {
  follower.classList.remove('in');
}

function checkboxClick(e) {
  const state = deleteSelected[this.dataset.id];

  deleteSelected[this.dataset.id] = !state;
  if (Object.keys(deleteSelected).some(key => deleteSelected[key] === true))
    btnDelete.removeAttribute('disabled');
  else
    btnDelete.setAttribute('disabled', 'disabled');
}

function deleteEntries(e) {
  Object.keys(deleteSelected).forEach((key) => {
    if (deleteSelected[key]) {
      $.ajax({
        'url': `/api/employees/${key}`,
        'type': 'DELETE',
      });
      $.ajax({
        'url': '/api/history',
        'type': 'POST',
        'data': {'command': `Deleted id: ${key}`, 'table': 'employees', 'admin_name': adminName}
      });
      updatePageSize();
      getEmployees();
      btnDelete.setAttribute('disabled', 'disabled');
    }
  });
}

function saveChanges(e) {
  for (let index = 0; index < insideInputs.length; index++) {
    if (insideInputs[index].className.includes('text-changed')) {
      changeSelected[insideInputs[index].dataset.id].bool = true;
      changeSelected[insideInputs[index].dataset.id].change += `[id: ${insideInputs[index].dataset.id}] ${insideInputs[index].dataset.col}: ${insideInputs[index].dataset.original} -> ${insideInputs[index].value}; `;
    }
  }

  Object.keys(changeSelected).forEach(key => {
    const dataChanged = {};
  
    Array.from(insideInputs).filter(input => input.dataset.id == key).map(input => [input.dataset.col, input.value]).splice(1, 4).forEach(tab => dataChanged[tab[0]]= tab[1]); 

    $.ajax({
      'url': `/api/employees/${key}`,
      'type': 'PUT',
      'data': dataChanged
    })
    if (changeSelected[key].change !== null && changeSelected[key].change != "") {
      $.ajax({
        'url': '/api/history',
        'type': 'POST',
        'data': {'command': changeSelected[key].change, 'table': 'employees', 'admin_name': adminName}
      });
    }
    updatePageSize();
    getEmployees();
  });
  getEmployees();
  undoChanges();
}

function submitForm(e) {
  const groups = addEmployeeForm.querySelectorAll('.form-group');
  let data = {};
  let sendData = true;

  groups.forEach(group => {
    const input = group.querySelector('input');
    const span  = group.querySelector('span');
    const pattern = patternExpressions[input.name];
    const matchedStr = input.value.trim().match(pattern);

    if (!matchedStr || matchedStr[0] !== input.value) {
      span.innerHTML = `Invalid ${input.name.replace('_', ' ')}`;
      sendData = false;
    }
    else 
      span.innerHTML = '';
    data[input.name] = input.value;
  });
 
  if (sendData) {
    $.ajax({
      'url': '/api/employees',
      'type': 'POST',
      'data': data
    });
    $('#add-modal').modal('toggle');
    $.ajax({
      'url': '/api/history',
      'type': 'POST',
      'data': { 'command': `Added employee ${data.first_name + ' ' + data.last_name}`, 'table': 'employees', 'admin_name': adminName }
    });
    updatePageSize();
  }
  getEmployees();
}

function updatePageSize() {
  $.getJSON('/api/size/history', (data) => {
    const size = parseInt(Math.ceil(data.size / PAGE_LIST_SIZE));

    document.querySelectorAll('.page-count>p>span')[1].innerHTML = size;
    document.querySelector('ul.pager>li#next>a').setAttribute('data-max', size);
    MAX_SIZE = size;
    getPageItems(parseInt(document.querySelectorAll('.page-count>p>span')[0].innerHTML));
  });
}

function getPageItems(page) {
  if (page != 1)
      if (page > paginationButtons[1].dataset.max || page < paginationButtons[0].dataset.min)
        return ;
  console.log('getting data')
  $.getJSON(`/api/pagination?limit=${PAGE_LIST_SIZE}&offset=${(page - 1) * PAGE_LIST_SIZE}`, (data) => {
    //document.querySelector('pre').innerHTML = JSON.stringify(data, null, 2);
    document.querySelectorAll('.page-count>p>span')[0].innerHTML = page;
    updatePageListHTML(data);
  });
}

function paginationButtonsClick(e) {
  const CURRENT_PAGE = parseInt(document.querySelectorAll('.page-count>p>span')[0].innerHTML);

  getPageItems(CURRENT_PAGE + parseInt(this.dataset.increment))
}

function updatePageListHTML(data) {
  const ul = document.querySelector('ul.list-content');

  ul.innerHTML = '';
  data.forEach(item => {
    ul.innerHTML += `<li class="list-group-item">${item.command} (made by <span class="list-red-text">${item.name}</span>) on <span class="list-blue-text">${item.date}</span></li>`;
  });
}

addEvents();
getAdmins();
updatePageSize();
getPageItems(1);
getEmployees();
