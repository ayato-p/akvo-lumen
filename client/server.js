/* eslint-disable */

var webpack = require('webpack');
var WebpackDevServer = require('webpack-dev-server');
var config = require('./webpack.config');


new WebpackDevServer(webpack(config), {
  hot: true,
  publicPath: config.output.publicPath,
  disableHostCheck: true,
  proxy: {
    '/api/**': {
      target: "http://t1.lumen.localhost:3000",
      secure: false
    },
    '/share/**': {
      target: "http://t1.lumen.localhost:3000",
      secure: false
    },
    '/env': {
      target: "http://t1.lumen.localhost:3000",
      secure: false
    }
  },
  historyApiFallback: {
    rewrites: [
      { from: '^/favicon.ico$', to: 'favicon.ico' },
      { from: '^/s/.*$', to: '/assets/index-pub.html' },
      { from: '^.*$', to: '/assets/index.html' }
    ]
  },
}).listen(3030, 't1.lumen.localhost', function (err, result) {
  if (err) {
    console.log(err);
  }

  console.log('Listening at t1.lumen.localhost:3030');
});

new WebpackDevServer(webpack(config), {
  hot: true,
  publicPath: config.output.publicPath,
  disablehostCheck: true,
  historyApiFallback: {
    rewrites: [
      { from: '^/favicon.ico$', to: 'favicon.ico' },
      { from: '^.*$', to: '/assets/index-landing.html' }
    ]
  }
}).listen(3031, 'www.lumen.localhost', function(err, restult) {
  if (err) {
    console.log(err);
  }

  console.log('Listening at www.lumen.localhost:3031');
});
