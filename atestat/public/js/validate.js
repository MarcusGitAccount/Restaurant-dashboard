
const form = document.querySelector('user-signup');

form.querySelector('input[type=text]').oninvalid.setCustomValidity('Name must have at least 3 characters with no white spaces');
form.querySelector('input[type=email]').oninvalid.setCustomValidity('Invalid email adress');
form.querySelectorAll('input[type-password]').oninvalid.forEach(password => password.setCustomValidity('Passwords must have at lest 6 characters and no white spaces'));
