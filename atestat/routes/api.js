
'use strict';

module.exports = (() => {
  const multer = require('multer');
  const path = require('path');
  const session = require('client-sessions');
  const bcrypt = require('bcryptjs');
  const express = require('express');
  const fs = require('fs');
  const url = require('url');

  const dblogic = require('../models/dblogic');
  const rootFolder = path.dirname(require.main.filename);
  
  const storage = multer.diskStorage({
    destination: path.join(rootFolder, '/public/upload'), 
    filename: (req, file, callback) => {
      console.log(file);
      callback(null, `${Date.now()}${path.extname(file.originalname)}`);
    }
  });

  const upload = multer({storage});
  
  const router = require('express').Router();
  const tables = dblogic.tables;

  router.use(require('body-parser').urlencoded({ 'extended': true}));
  router.use(require('body-parser').json());

  router.get('/', (request, response) => {
    response.end('Web api for serving this project\'s db');
  });

  router.get('/administrators', (request, response) => {
    let query = url.parse(request.url, true).query;

    dblogic.selectAndSort('administrators', query, 'id', 'name', 'email', 'registration_date').then(
      (result) => {
        response.json(result);
    });
  });

  router.get('/administrators/:id', (request, response) => {
    // if (tables.indexOf(request.params.name.toLowerCase()) === -1) response.json({'error': 'No such table in db'});
    dblogic.selectById('administrators', parseInt(request.params.id), 'id', 'name', 'email', 'registration_date').then((result) => {
      response.json(result);
    });
  });

  router.get('/ingredients', (request, response) => {
    const query = url.parse(request.url, true).query;

    dblogic.selectAndSort('ingredients', query, 'id', 'name', 'quantity', 'price', 'photo').then(
      (result) => {
        response.json(result);
    });
  });

  router.get('/ingredients/:id', (request, response) => {
    let query = url.parse(request.url, true).query;

    dblogic.selectById('ingredients', parseInt(request.params.id), 'id', 'name', 'quantity', 'price', 'photo').then(
      (result) => {
        response.json(result);
    });
  });

  router.get('/size/:table', (request, response) => {
    if (tables.indexOf(request.params.table.toLowerCase()) === -1) {
      response.json({'error': 'No such table in db', 'size': 0});
    }

    dblogic.getSize(request.params.table.toLowerCase()).then(result => {
      response.json(result);
    });
  });


  router.post('/ingredients', upload.any(), (request, response) => {
    console.log(request.body, request.files);
    const newPath = path.join(request.files[0].destination, request.files[0].originalname);
    const newIngredient = {
      'name': request.body.name.trim().toLowerCase(),
      'quantity': request.body.quantity.trim(),
      'price': request.body.price.trim(),
      'PHOTO': request.files[0].originalname
    }

    fs.rename(request.files[0].path, newPath, error => {
      if (error) response.end('Error while uploading image');
    });

    dblogic.insertColumns('ingredients', newIngredient);
    response.status(200).json(newIngredient);
  });

  router.delete('/ingredients', (request, response) => {
    fs.unlink(path.join(rootFolder, '/public/upload', request.body.image), error => {
      if (error) response.end('Error when deleting image');
    });
    let result = dblogic.deleteIngredientByName(request.body.name);
    response.json(result);
  });

  router.get('/employees', (request, response) => {
    let query = url.parse(request.url, true).query;

    dblogic.selectAndSort('employees', query, 'id', 'first_name', 'last_name', 'email', 'phone_number', 'salary', 'job_name', 'hire_date').then(result => response.json(result));
  });

  router.get('/employees/:id', (request, response) => {
    dblogic.selectById('employees', parseInt(request.params.id), 'first_name', 'last_name', 'email', 'phone_number', 'salary', 'job_name', 'hire_date').then(result => response.json(result));
  });

  router.post('/employees', (request, response) => {
    dblogic.insertColumns('employees', {
      first_name: request.body.first_name,
      last_name: request.body.last_name,
      phone_number: request.body.phone_number,
      salary: request.body.salary,
      job_name: request.body.job_name,
      email: request.body.email
    })
    response.end('This function is pure shit ... Too much effort required to change it now.');
  });

  router.put('/employees/:id', (request, response) => {
    console.log(request.body)
    dblogic.updateTable('employees', {id: request.params.id}, {
      'phone_number': request.body.phone_number,
      'salary': request.body.salary,
      'job_name': request.body.job_name,
      'email': request.body.email
    }, (error) => {
      if (error)
        response.status(204).end('Something went wrong');
    });
    response.status(200).end('Item changed');
  });

  router.delete('/employees/:id', (request, response) => {
    dblogic.deleteById('employees', request.params.id, (err) => {
      if (err)
        response.status(204).end('Something went wrong');
    });
    response.status(200).end('Item deleted from db');
  });

  router.get('/pagination', (request, response) => {
    let query = url.parse(request.url, true).query;

    console.log(query)
    dblogic.pagination(query.limit, query.offset, (err, data) => {
      if (err) {
        response.status(204).end('Something went wrong');
        return ;
      }
      response.status(200).json(data);
    });
  });

  router.post('/history', (request, response) => {
    dblogic.insertHistory({
      'command': request.body.command,
      'table': request.body.table,
      'admin_name': request.body.admin_name
    }, (err) => {
      if (err)
        response.status(204).end('Something went wrong');
    });
    response.status(200).end('Item added to HISTORY');
  });


  router.post('/menu', upload.any(), (request, response) => {
    console.log(request.body, request.files);
    response.end(`/public/upload/${request.files[0].filename}`);
  });
  
  router.get('/menu', (request, response) =>{
    const query = url.parse(request.url, true).query;
    
    dblogic.selectAndSort('menu', query, 'name', 'quantity', 'price', 'images', 'ingredients').then(
      (result) => {
        response.json(result);
    });
  });
  
  router.post('/menuitem', (request, response) => {
    const newMenuItem = {
      name: request.body.name.trim().toLocaleLowerCase(),
      quantity: request.body.quantity.trim(),
      ingredients: request.body.ingredients.trim(),
      images: request.body.images.trim(),
      price: request.body.price.trim()
    };
    
    dblogic.insertColumns('menu', newMenuItem);
    response.status(200).json(newMenuItem);
  });
  
  router.delete('/menuitem',(request, response) => {
    const result = dblogic.deleteMenuItemByName(request.body.name);
    response.end('Deleted');
  });
  
  router.delete('/files', (request, response) => {
    console.log(path.join(rootFolder, 'public/upload', request.body.filename));
    
    fs.unlink(path.join(rootFolder, 'public/upload', request.body.filename), (error) => {
      if (error)
        response.end('error sunshine');
        return ;
    });
    response.end('file deleted');
  });
  
  return router;
});