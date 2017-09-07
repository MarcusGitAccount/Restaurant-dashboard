

/* Modal logic here */

function approveModal(e) {
  let location = this.dataset.href;

  window.location.href = location;
}

document.querySelector('.btn-yes').addEventListener('click', approveModal);

/* Navigation logic here  */

const spans = document.querySelectorAll('span.info-badge');

function changeBadgeContent(span) {
  $.get(`/api/size/${span.dataset.table}`, data => {
    span.innerHTML = data.size;
  });
}


function bindCustomNumberInputEvents() {
  const inputs = document.querySelectorAll('.custom-number-input');
  
  inputs.forEach(input => {
    bindInput(input);
  });
}

function bindInput(input, callback) {
  const text = input.querySelector('input[type=text]');
  const spans = input.querySelectorAll('span');
  
  function spanClick(e) {
    const increment = parseInt(this.dataset.step) * parseInt(this.dataset.increment);
    const newValue = parseInt(text.value) + increment;
    
    if (newValue < parseInt(text.dataset.min) || newValue > parseInt(text.dataset.max))
      return ;
    
    text.value = newValue; 
    text.style.width = `${(text.value.length > 1 ? text.value.length : 0) * 10 + 20}px`;
    if (callback instanceof Function)
      callback(increment, input.previousElementSibling.value);
  }
  
  text.style.width = `${(text.value.length > 1 ? text.value.length : 0) * 10 + 20}px`;
  spans.forEach(span => span.addEventListener('click', spanClick)); 
}

spans.forEach(span => changeBadgeContent(span));
//bindCustomNumberInputEvents();