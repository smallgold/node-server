var http = require("http");
var url = require("url");

var Allow_Origin = [ // 白名单
  'http://localhost:8080',
  'http://localhost:8081',
  'http://localhost:8082',
]

function start(route, handle) {
  function onRequest(request, response) {
    for (var i = 0; i < Allow_Origin.length; i++) {
      if (Allow_Origin[i] == request.headers.origin) {
        response.setHeader('Access-Control-Allow-Origin', Allow_Origin[i]);
      } else {
        response.send({
          code: -2,
          msg: '非法请求'
        });
      }
    }
    response.setHeader('Access-Control-Allow-Credentials', true);
    response.setHeader("Access-Control-Allow-Headers", "Content-Type,Content-Length, Authorization, Accept,X-Requested-With");
    response.setHeader("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
    response.setHeader('Content-Type', 'application/json;charset=utf-8');

    var urlObj = url.parse(request.url);
    var pathname = urlObj.pathname;
    var query = urlObj.query;
    console.log("Request for " + pathname + " received." + " query: " + query);
    route(pathname, query, handle, response);
  }

  http.createServer(onRequest).listen(8888);
  console.log("Server has started.");
}

exports.start = start;