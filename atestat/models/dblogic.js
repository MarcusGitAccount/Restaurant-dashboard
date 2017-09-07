
'use strict';

const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./databases/food.db');
const tables = ['administrators', 'ingredients', 'menu', 'orders', 'employees', 'history'];

function selectColumn(table) {
  const statement = " SELECT " + Array.prototype.slice.call(arguments, 1).join(",") + " FROM " + table;

  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.all(statement, (err, row) => {
        if (err) resolve({'error': err}); 
        resolve({rows: row});
      });
    });
  });
}

function insertColumns(table, data) {
  let valuesArray = [];

  for (let property in data)
    valuesArray.push(sqlString(data[property]));
  const columns = ['(', Object.keys(data).join(', '), ')'].join('');
  const values = ['(', valuesArray.join(', '), ')'].join('');
  const statement = "INSERT OR IGNORE INTO " + table + " " + columns + " VALUES " + values;

  console.log(statement);
  //db.run("BEGIN TRANSACTION");
  db.serialize(() => {
    db.run(statement, (err) => {
      if (err) return { error: err };
    });
  });

}

function sqlString(value) {
  return ["'", value, "'"].join('');
}

function updateTable(table, where, newValues, callback) {
  let columns = [];
  let conditions = [];

  Object.keys(where).forEach(key => conditions.push([key, sqlString(where[key])].join(' = ')));
  Object.keys(newValues).forEach(key => columns.push([key, sqlString(newValues[key])].join(' = ')));

  let statement = "UPDATE " + table + " SET "+ columns.join(', ') + " WHERE " + conditions.join('AND ');

    console.log(statement);

  db.serialize(() => {
    db.run(statement, (err) => {
      if (err) {
        callback(err);
        return ;
      }
    });
  });
}

function deleteValue(table, where) {
  let conditions = [];

  Object.keys(where).forEach(key => conditions.push([key, sqlString(where[key])].join(' = ')));
  let statement = "DELETE FROM " + table + " WHERE " + conditions.join('AND ');

  db.serialize(() => {
    db.run(statement, (err) => {
      if (err) throw err;
    });
  });

  //return {statement: statement};
}

function selectAndSort(table, where) {
  let conditions = [];
  let conditionStr = '';
  
  if (typeof(where) === 'object')
    Object.keys(where).forEach(key => conditions.push([key, where[key]].join(' ')));

  if (conditions.length !== 0)
   conditionStr = " ORDER BY " + conditions.join(', ');
  let statement = " SELECT " + Array.prototype.slice.call(arguments, 2).join(", ") + " FROM " + table + conditionStr;

  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.all(statement, (err, row) => {
        if (err) resolve({'error': err}); 
        resolve({rows: row});
      });
    });
  });
}

function selectById(table, id) {
  let statement = " SELECT " + Array.prototype.slice.call(arguments, 2).join(",") + " FROM " + table + " WHERE id=" + id;

  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.all(statement, (err, row) => {
        if (err) resolve({'error': err});
        resolve({rows: row});
      });
    });
  });
}

function selectLogin(name) {
  let statement = 'SELECT name, password, salt FROM administrators WHERE name=' + sqlString(name);

  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.all(statement, (err, row) => {
        if (err) resolve({'error': err});
        resolve({rows: row, statement: statement});
      });
    });
  });
}

function selectSignUp(name, email) {
  //let statement = 'SELECT name, password, salt, email FROM administrators WHERE name=' + sqlString(name);

  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.all('SELECT name, password, email FROM administrators WHERE name=? OR email=?',  name, email, (err, row) => {
        if (err) resolve({'error': err});
        resolve({rows: row});
      });
    });
  });
}

function selectNamePassword(name, password) {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.all('SELECT name, password, salt FROM administrators WHERE name=? AND password=?',  name, password, (err, row) => {
        if (err) resolve({'error': err});
        resolve({rows: row});
      });
    });
  });
}

function getSize(table) {
  let statement = 'select count(*) from ' + table;

  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.all(statement, (err, row) => {
        if (err) resolve({'error': err});
        else resolve({size: row[0]['count(*)']});
      });
    });
  });
}

function deleteIngredientByName(name) {
  db.serialize(() => {
    db.run('delete from ingredients where NAME = ?', name, (err) => {
      if (err) return { error: err };
    });
  });
  //return {statement: `delete from ingrediente where NAME = ${name}`};
}

/* Down from here only callbacks, no promises */

function deleteById(table, id, callback) {
  const statement = `delete from ${table} where id = ?`;

  db.serialize(() => {
    db.run(statement, id, (error) => {
      if (error) {
        callback(error);
        return ;  
      }
    });
  });
}

function insertHistory(data, callback) {
  const values = [];

  values.push(data.command);
  values.push(data.table);
  values.push(data.admin_name);
  
  db.serialize(() => {
    db.run("insert into history (command, table_name, administrator_id) values (?, ?, (select id from administrators where name = ?))", values, (error) => {
      if (error) {
        callback(error);
        return ;
      }
    });
  });
}

function pagination(limit, offset, callback) {
  db.serialize(() => {
    db.all(`select h.id, h.command, h.date, a.name from history h 
    join administrators a on (h.administrator_id = a.id) limit ? offset ?`, 
    [parseInt(limit), parseInt(offset)], (error, row) =>{
      if (error) {
        callback(error);
        return ;
      }
      callback(null, row);
    })
  })
}

function deleteMenuItemByName(name) {
  db.serialize(() => {
    db.run('delete from menu where NAME = ?', name, (err) => {
      if (err) return { error: err };
    });
  });
}

module.exports = {
  'selectColumn': selectColumn,
  'insertColumns': insertColumns,
  'updateTable': updateTable,
  'deleteValue': deleteValue,
  'selectAndSort': selectAndSort,
  'selectById': selectById,
  'selectLogin': selectLogin,
  'selectNamePassword': selectNamePassword,
  'selectSignUp': selectSignUp,
  'getSize': getSize,
  'deleteIngredientByName': deleteIngredientByName,
  'tables': tables,
  'deleteById': deleteById,
  'insertHistory': insertHistory,
  'pagination': pagination,
  deleteMenuItemByName: deleteMenuItemByName
};
