
const menuForm = document.querySelector('form#form-add-menu-item');
const chooseImage = document.querySelector('#img-input');
const submitMenuButton = menuForm.querySelector('#submit-menu');
const previewDiv =  document.querySelector('.preview');

const ingredientsDiv = document.querySelector('#ingredients');
let ingredientInputs = document.querySelectorAll('.ingredient-input-group');
let ingredients = null;
let quantity = {};

const images = {};
const quantityHolder = document.querySelector('#quantity');
const priceHolder = document.querySelector('.price-textbox');

const TAX = 5;

const customInputHTML = `<span data-step="1" data-increment="-1"><i class="fa fa-minus" aria-hidden="true"></i></span>
      <input class="custom-number-input-textbox ingredient-quantity" type="text" value="1" data-max="500" data-min="0" readonly>
      <span data-step="1" data-increment="1"><i class="fa fa-plus" aria-hidden="true"></i></span>`;

function previewImgClick(e) {
  const name = this.querySelector('img').src.split('/').pop();
  
  $.ajax({
    'url': '/api/files',
    'type': 'DELETE',
    'data': {'filename': name},
  });
  
  delete images[name];
  previewDiv.removeChild(this)
}

function bindEvents() {
  chooseImage.onclick = function() {
    this.value = null;
  };
  chooseImage.addEventListener('change', (e) => {
    const data = new FormData(menuForm);
    const XHR = new XMLHttpRequest();
    
    XHR.open('POST', `/api/menu`, true);
    XHR.onload = (xhrEvent) => {
      if (XHR.status === 200) {
        const img = `<div class="preview-thumbnail" title="Click to delete image">
                     <div class="image-rel">
                       <img src="${XHR.responseText}" alt="Upload preview image" class="preview-image col-xl-2 col-md-3 col-sm-4 col-xs-6 ">
                     </div>
                   </div>`;
        images[XHR.responseText.split('/').pop()] = XHR.responseText;
        previewDiv.innerHTML += img;
        previewDiv.querySelectorAll('.preview-thumbnail').forEach(img => img.addEventListener('click', previewImgClick));
       
        return ;
      }
      console.log('Error %s', XHR.status);
    };
    XHR.send(data);
     
    e.preventDefault();
  });
}

function addLogic() {
  ingredientInputs = document.querySelectorAll('.ingredient-input-group');
  document.querySelectorAll('.add-waypoint').forEach(btn => btn.addEventListener('click', addIngredientInput));
  document.querySelectorAll('.delete-waypoint').forEach(btn => btn.addEventListener('click', deleteIngredientInput));
}

function getIngredients(callback) {
  if (ingredients) {
    callback(ingredients);
    return ;
  }
  
  $.getJSON('/api/ingredients', data => {
    ingredients = data;
    callback(data);
  });
}

function autocompleteChange(e, data) {
  changeQuantities();
}

function quantityLogicCallback(data, name) {
  changeQuantities();
}

function getIngredient(name) {
  for (let index = 0; index < ingredients.rows.length; index++)
    if (ingredients.rows[index].name === name)
      return ingredients.rows[index];
  return null;
}

function changeQuantities() {
  quantity = {};
  document.querySelectorAll('.ingredient-input-group').forEach(group => {
    const name = group.querySelector('.ingredient-name').value;
    
    if (name && name !== '') {
      const itemsNumber = parseInt(group.querySelector('.ingredient-quantity').value);
      const ingredient = getIngredient(name);

      if (!ingredient)
        return ;

      quantity[name] = {};
      quantity[name].quantity = itemsNumber * ingredient.quantity;
      quantity[name].price = ingredient.price * itemsNumber;
      
      const total = Object.keys(quantity).reduce((a, b) => {
        return {quantity: quantity[b].quantity + a.quantity || 0, price: quantity[b].price + a.price || 0};
      }, {quantity: 0, price: 0});
      
      quantityHolder.innerHTML = total.quantity;
      priceHolder.value = total.price + TAX;
      priceHolder.style.width = `${(priceHolder.value.length > 1 ? priceHolder.value.length : 0) * 10 + 20}px`;
    }
  });
}

function addIngredientInput(e) {
  const nextElement = document.createElement('DIV');
  const customInput = document.createElement('DIV');
  const addButton = document.createElement('button');
  const deleteButton = document.createElement('button');
  const input = document.createElement('input');
 
  customInput.innerHTML = customInputHTML;
  customInput.className = 'custom-number-input ingredient';
  bindInput(customInput, quantityLogicCallback);
  
  input.className = 'form-control item-name-box control ingredient-name';
  input.setAttribute('type', 'text');
  input.setAttribute('placeholder', 'Enter name and quantity');
  
  getIngredients(data => {
    $(input).autocomplete({
      source: data.rows.map(ingredient => ingredient.name),
      minlength: 2,
      select: autocompleteChange
    });
  });
  
  nextElement.className = 'form-group col-lg-6 col-md-6 col-sm-12 col-xs-12 item-inline ingredient-input-group';
  nextElement.appendChild(input);
  nextElement.appendChild(customInput);
  
  addButton.setAttribute('type', 'button');
  addButton.className = 'btn btn-grey add-waypoint';
  addButton.innerHTML = '<i class="fa fa-plus" aria-hidden="true"></i>';
  addButton.addEventListener('click', addIngredientInput);
  
  deleteButton.setAttribute('type', 'button');
  deleteButton.className = 'btn btn-grey delete-waypoint';
  deleteButton.innerHTML = '<i class="fa fa-eraser" aria-hidden="true"></i>';
  deleteButton.addEventListener('click', deleteIngredientInput);
  
  nextElement.appendChild(addButton);
  nextElement.appendChild(deleteButton);
  
  if (this.parentNode.nextElementSibling)
    ingredientsDiv.insertBefore(nextElement, this.parentNode.nextElementSibling);
  else
    ingredientsDiv.appendChild(nextElement);
}

function deleteIngredientInput(e) {
  if (ingredientsDiv.childElementCount > 1) {
    ingredientsDiv.removeChild(this.parentNode);
    changeQuantities();
  }
}

function clearInputZone() {
  while (ingredientsDiv.childElementCount > 1)
	  ingredientsDiv.removeChild(ingredientsDiv.lastChild);
	
	document.querySelector('#file-input-div > input[type=file]').value = '';
	document.querySelector('#ingredient-name').value = '';
	previewDiv.innerHTML = '';
	ingredientsDiv.firstElementChild.querySelector('input').value = '';
	priceHolder.value = 0;
	quantityHolder.innerHTML = '0';
}

function submitMenuItem() {
  const _images = Object.keys(images).map(key => images[key]).join(';');
  const ingredients = Object.keys(quantity).map(key => `${key} ${quantity[key].quantity}`).join(';');
  const name = document.querySelector('#ingredient-name').value;
  const _quantity = quantityHolder.innerHTML;
  const price = priceHolder.value;
  const XHR = new XMLHttpRequest();
  const _span = document.querySelector('span[data-table=menu]').innerHTML;
  
  if (!_images || !ingredients || !name || quantity === 0 || price === 0)
    return ;
  
  XHR.open('POST', '/api/menuitem', true);
  XHR.setRequestHeader('Content-type', 'application/json');
  XHR.onreadystatechange = () => {
    if (XHR.readyState === 4 && XHR.status === 200) {
      const response = JSON.parse(XHR.responseText);
      const _span = document.querySelector('span[data-table=menu]');
      
       _span.innerHTML = parseInt(_span.innerHTML) + 1;
       putMenuitem(response);
       clearInputZone();
       
      console.log(response);
      return ;
    }
  };
  XHR.send(JSON.stringify({name: name, price: price, quantity: _quantity, ingredients: ingredients, images: _images}));
}

function putMenuitem(menuitem) {
  const container = document.createElement('DIV');
  const title = document.createElement('DIV');
  const imagesDiv = document.createElement('DIV');
  const info = document.createElement('DIV');
  
  const ingredientsDiv = document.createElement('DIV');
  const innerIngredients = document.createElement('DIV');
  const ingredientsList = document.createElement('UL');
  
  const btn = document.createElement('BUTTON');
  
  container.className = 'menu-item well';
  
  title.className = 'row';
  title.innerHTML = `<div class="col md-12 ingredient-title">
                      <span class="menu-item-title">${menuitem.name}</span>
                    </div>`;
  
  imagesDiv.className = 'images row';
  menuitem.images.split(';').forEach(src => {
    imagesDiv.innerHTML += `<img src="${src}" alt="gallery image" class="img-responsive col-xl-2 col-md-3 col-sm-4 col-xs-6">`;
  });
  
  ingredientsDiv.className = 'menu-info row';
  innerIngredients.className = 'ingredients-list col-md-6 col-sm-6 col-xs-12';
  ingredientsList.className = 'list-group';
  menuitem.ingredients.split(';').forEach(ingredient => {
    const _split = ingredient.split(' ');
    const _quantity = _split.pop();
    const _name = _split.join(' ');
    
    ingredientsList.innerHTML += `<li class="list-group-item">
                                    <span class="ingredient-name-in-list">${_name}</span>
                                    <span class="badge info">${_quantity}g</span>
                                  </li>`;
  });
  
  innerIngredients.appendChild(ingredientsList);
  ingredientsDiv.appendChild(innerIngredients);
  
  info.className = 'col-md-6 col-sm-6 col-xs-12';
  info.innerHTML = `<ul class="list-group">
                      <li class="list-group-item">
                        Quantity
                        <span class="badge info">${menuitem.quantity}g</span>
                      </li>
                      <li class="list-group-item">
                        Price
                        <span class="badge info">${menuitem.price} RON</span>
                      </li>
                    </ul>`;
  btn.setAttribute('type', 'button');
  btn.className = 'btn btn-grey delete-menu-item';
  btn.appendChild(document.createTextNode(`Delete ${menuitem.name} from menu`));
  btn.setAttribute('data-name', `${menuitem.name}`);
  btn.addEventListener('click', deleteMenuitem);
  info.appendChild(btn);
  
  ingredientsDiv.appendChild(info);
  
  container.appendChild(title);
  container.appendChild(imagesDiv);
  container.appendChild(ingredientsDiv);

  document.querySelector('.menu-items-container').appendChild(container);
}

function deleteMenuitem(e) {
  const _span = document.querySelector('span[data-table=menu]');

  document.querySelector('.menu-items-container').removeChild(this.parentNode.parentNode.parentNode);
   _span.innerHTML = parseInt(_span.innerHTML) - 1;
   
  $.ajax({
    url: '/api/menuitem',
    type: 'DELETE',
    data: {name: this.dataset.name},
  });
}

function putAllMenuitems() {
  $.getJSON('/api/menu', data => {
    data.rows.forEach(item => putMenuitem(item));
  });
}

addLogic();
bindEvents();
(function _init() {
  document.querySelector('#submit-menu').addEventListener('click', submitMenuItem);
  putAllMenuitems();
  bindInput(document.querySelector('#price'));
  bindInput(document.querySelector('#first-input'), quantityLogicCallback);
  getIngredients(data => {
    $('#first').autocomplete({
      source: data.rows.map(ingredient => ingredient.name),
      minlength: 2,
      select: autocompleteChange
    });
  });
})();