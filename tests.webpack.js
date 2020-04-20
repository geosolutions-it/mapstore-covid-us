var context = require.context('./js', true, /(-test\.jsx?)|(-test-chrome\.jsx?)$/);
context.keys().forEach(context);
module.exports = context;
