
'use strict';

module.exports = (function() {
  const router = require('express').Router();
  const path = require('path');
  const bcrypt = require('bcryptjs');
  const session = require('client-sessions');
  const dblogic = require('../models/dblogic');
  const csrf = require('csurf');

  router.use(require('body-parser').urlencoded({ 'extended': true}));
  router.use(require('body-parser').json());
  router.use(session({
    'cookieName': 'session',
    'secret': 'Oh, you really want to know? Never!',
    'duration': 60 * 60 * 1000,
    'activeDuration': 5 * 60 * 1000,
    'httpOnly': true,
    'ephemeral': true
  }));
  router.use(csrf());

  router.get('/', (request, response) => {
    let token = request.csrfToken();
    response.locals.csrfToken = token;

    if (request.session && request.session.user) {
      request.session.user.password = '';
     // response.locals.user = request.session.user; why the csrf token was not working ..
      request.session.reset();
    }

    response.render(path.join('home', 'index.ejs'), {
      'model': {
        'title': 'Login in/Sign up',
        'error': ''
      },
    });
  });

  router.get('/about', (request, reponse) => {
    reponse.render(path.join('home', 'about.ejs'), {
      'model': {
        'title': 'About',
        'about': 'about page'
      }
    });
  });

  router.get('/contact', (request, reponse) => {
    reponse.render(path.join('home', 'contact.ejs'), {
      'model': {
        'title': 'Contact',
        'about': 'Contact page'
      }
    });
  });

  router.post('/login', (request, response) => {
    let token = request.csrfToken();

    dblogic.selectLogin(request.body.user_login_name.trim()).then(result => {
      if (result.rows.length === 0) {
        response.locals.csrfToken = token;
        response.locals.error = {'title': 'Given username was not found or retrieved from the database'};
        response.render(path.join('home', 'index.ejs'), {'model': { 'title': 'Login in/Sign up'}});
      }
      else if (!bcrypt.compareSync(request.body.user_login_password.trim(), result.rows[0].password)) {
        response.locals.csrfToken = token;
        response.locals.user = {name: request.body.user_login_name.trim()};
        response.locals.error = {'title': 'Incorrect password'};
        console.log(response.locals.error);
        response.render(path.join('home', 'index.ejs'), {'model': { 'title': 'Login in/Sign up'}});
      }
      else {
        request.session.user = result.rows[0];
        //console.log('Session user %s:', request.session.user);
        response.redirect('/dashboard');
      }
    });
  });

  router.post('/register', (request, response) => {
    let error = '';
    const token = request.csrfToken();

    if (request.body.user_signup_password_first.trim() !== request.body.user_signup_password_second.trim()) {
      error = 'Passwords don\'t match';
      response.locals.tryagain = {'name': request.body.user_signup_name, 'email': request.body.user_signup_email};
      response.locals.csrfToken = token;
      response.locals.error = {title: error};
      response.render(path.join('home', 'index.ejs'), {'model': { 'title': 'Login in/Sign up'}});
    }
    else {
      dblogic.selectSignUp(request.body.user_signup_name.trim(), request.body.user_signup_email.trim()).then((result) => {
        if (result.rows.length !== 0) {
          error = 'Username or email already taken';
          response.locals.csrfToken = token;
          response.locals.error = {title: error};
          response.render(path.join('home', 'index.ejs'), {'model': { 'title': 'Login in/Sign up'}});
        }
        else {
          let salt = bcrypt.genSaltSync(10);
          let hash = bcrypt.hashSync(request.body.user_signup_password_first.trim(), salt);

          dblogic.insertColumns('administrators', {
            'name': request.body.user_signup_name.trim(),
            'salt': request.body.user_signup_name.trim(),
            'password': hash,
            'email': request.body.user_signup_email.trim()
          });

          response.render(path.join('home', 'registration_succes.ejs'), {'model': {
            'title': 'Succesful registration',
            'name':  request.body.user_signup_name
          }});
        }
      });
    }
  });

  return router;
});