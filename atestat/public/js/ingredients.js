
function getIngredients(sort = 'ASC') {
  $.get(`/api/ingredients?name=${sort}`, data => {
    populateIngredients(data.rows);
    deleteButtons = document.querySelectorAll('.btn-delete');
    deleteButtons.forEach(btn => btn.addEventListener('click', deleteIngredient));
  });
}

function putIngredient(ingredient)
{
  return `<div class="col-xl-3 col-md-4 col-sm-6 col-xs-12 fixed-height">
          <div style="" class="thumbnail ingredient">
            <img class="img-responsive" style="" src="${ingredient.PHOTO ? "/public/upload/" + ingredient.PHOTO : 'https://placeholdit.imgix.net/~text?txtsize=23&txt=250%C3%97250&w=250&h=250'}" alt="ingredient">
            <div class = "caption">
              <h4 style="text-transform: capitalize;">${ingredient.name}</h4>
              <ul class="list-group">
                <li class="list-group-item">Quantity <span class="badge grey">${ingredient.quantity}g</span></li>
                <li class="list-group-item">Price <span class="badge grey">${ingredient.price} lei</span></li>
              </ul>
              <a data-src=${ingredient.PHOTO} data-name=${ingredient.name} style="width: 100%;" href = "#" class = "btn btn-grey btn-delete" role = "button">Delete ingredient</a> 
            </div>
          </div>
        </div>`;
}

function populateIngredients(ingredients) {
  let html = '';

  ingredients.forEach(ingredient => {
     html += putIngredient(ingredient);
  });

  ingredientsDiv.innerHTML = html;
}

function addIngredient(name, quantity, price, image) {
  ingredientsDiv.innerHTML += putIngredient({name, quantity, price, PHOTO: image});
}

function deleteIngredient(e) {
  let nbr = parseInt(document.querySelector('li:last-of-type>span').innerHTML);

  $.ajax({
    'url': '/api/ingredients',
    'type': 'DELETE',
    'data': {'name': this.dataset.name, 'image': this.dataset.src},
  });
  ingredientsDiv.removeChild(this.parentNode.parentNode.parentNode);
  document.querySelector('li:last-of-type>span').innerHTML = nbr - 1;
}

getIngredients();

/* Send form logic here */

const ingredientsDiv = document.querySelector('.ingredients');
const buttonSubmit = document.querySelector('.btn-add');
const form = document.querySelector('#form-add-ingredient');
const inputs = form.querySelectorAll('input');
const sortingButtons = document.querySelectorAll('.btn-sort');
let deleteButtons = document.querySelectorAll('.btn-delete');

function sortingButtonsClick(e) {
  getIngredients(this.dataset.sort);
}

deleteButtons.forEach(btn => btn.addEventListener('click', deleteIngredient));
sortingButtons.forEach(btn => btn.addEventListener('click', sortingButtonsClick));

buttonSubmit.addEventListener('click', (e) => {
  const data = new FormData(form);
  const XHR = new XMLHttpRequest();
  const imageName = inputs[3].value.match(/[\w\d.]+/g);
  const nbr = parseInt(document.querySelector('li:last-of-type>span').innerHTML);

  XHR.open('POST', '/api/ingredients', true);
  XHR.onload = function(oEvent) {
    if (XHR.status == 200) {
      const response = JSON.parse(XHR.responseText);
      
      ingredientsDiv.innerHTML += putIngredient(response);
      deleteButtons = document.querySelectorAll('.btn-delete');
      deleteButtons.forEach(btn => btn.addEventListener('click', deleteIngredient));
      console.log(response);
    }
    else console.log("Error: %s", XHR.status);
  };
  
  XHR.send(data);
  e.preventDefault();
  $('#add-modal').modal('toggle');
  document.querySelector('li:last-of-type>span').innerHTML = nbr + 1;
}, false);
