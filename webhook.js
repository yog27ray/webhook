spawn = require('child_process').spawn;
const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const match = require('./match');

const app = express();
let config;

app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({extended: true})); // for parsing application/x-www-form-urlencoded

if (process.argv.indexOf('-config') !== -1) {
  try {
    config = JSON.parse(fs.readFileSync(process.argv[process.argv.indexOf('-config') + 1], 'utf8'));
  } catch (err) {
    console.log('Invalid config file.');
    return;
  }
}

if (!config) {
  console.log('Missing config file.');
  return;
}

function executeCommand(command) {
  if (!command) {
    console.log('No command found');
    return;
  }
  exec = ['sh', '-c', command];
  cp = spawn(exec.shift(), exec, {});
  cp.stdout.pipe(process.stdout);
  cp.on('error', function (err) {
    return eventsDebug('Error executing command [%s]: %s', rule.exec, err.message)
  });
}

const port = config.port || 3000;
app.post('/:id', function (req, res) {
  let response = 'No hook found with id ' + req.params.id;
  const hookFound = config.rules.some(function (item) {
    if (item.id === req.params.id) {
      console.log("Hook " + item.id + " found.");
      if (item.match) {
        if (item.secret && item.secret !== req.query.secret) {
          response = 'Invalid secret key.';
          return false;
        }
        if (match.check(req.body, item.match)) {
          console.log("Executing webhook " + req.params.id);
          executeCommand(item['execute-command']);
          res.json(item.response || "success");
          return true;
        }
        response = 'Condition does not match.';
        return false;
      }
      console.log("Executing webhook " + req.params.id);
      executeCommand(item['execute-command']);
      res.json(item.response || "success");
      return true;
    }
  });
  console.log(response);
  if (!hookFound) return res.send(response)
});

app.listen(port, function () {
  console.log('App listening on port ' + port + '!')
});
