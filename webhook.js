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

const port = config.port || 3000;
app.post('/:id', function (req, res) {
  let hookFound = false;
  config.rules.forEach(function (item) {
    if (hookFound) return;
    if (item.id === req.params.id) {
      hookFound = true;
      if (item.match) {
        if (item.secret && item.secret !== req.query.secret) {
          return res.json('Invalid secret key.')
        }
        if (match.check(req.body, item.match)) {
          exec = ['sh', '-c', item['execute-command']];
          cp = spawn(exec.shift(), exec, {});
          cp.stdout.pipe(process.stdout);
          cp.on('error', function (err) {
            return eventsDebug('Error executing command [%s]: %s', rule.exec, err.message)
          });
          return res.json(item.response || "success");
        }
        return res.json('Condition does not match.');
      }
      return res.json(item.response || "success");
    }
  });
  if (!hookFound) return res.send('No hook found')
});

app.listen(port, function () {
  console.log('App listening on port ' + port + '!')
});
