var arrayConstructor = [].constructor;
var jsonConstructor = {}.constructor;

function objectType(object) {
  if (object) {
    if (object.constructor === arrayConstructor) {
      return "array";
    }
    if (object.constructor === jsonConstructor) {
      return "json";
    }
  }
  return '';
}

function check(input, condition) {
  if (!input) return false;
  if (!condition) return true;
  var keys = Object.keys(condition);
  return keys.every(function (key) {
    if (key === '$and') return condition[key].every(function (x) {
      return check(input, x);
    });
    if (key === '$or') return condition[key].some(function (x) {
      return check(input, x);
    });
    switch (objectType(condition[key])) {
      case 'array': {
        return condition[key]
            .every(function (x, index) {
              return check(input[key][index], x);
            })
      }
      case 'json': {
        return check(input[key], condition[key]);
      }
      default:
        return input[key] === condition[key];
    }
  });
}

module.exports = {
  check: check
};