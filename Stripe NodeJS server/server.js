var http = require('http');
var stripe = require("stripe")("sk_test_Qc3frsXwp1sA8KnQSXC1SU6i"); //sk_live_a1xXvLdotJMA96BQkAPYBmcm

var prt = 3000;
var server;

console.log("Server Started...");

server = http.createServer(function(req, resp) {

  console.log(req.url);
  
  if (req.url === "/ephemeral_keys") {
    issueKeyHandler(req, resp);
  } else if (req.url === "/create_customer") {
    createCustomer(req, resp);
  } else if (req.url === "/charge") {
    charge(req, resp);
  } else {
    resp.writeHead(404, {"Content-Type" : "text/json"});
    resp.end('{"status" : "error - unknown endpoint"}');
  }

}).listen(prt);

function createCustomer(req, res) {
  if (req.method === "POST") {
    console.log("createCustomer");
    eid = req.headers["email"]
    console.log(eid);

    stripe.customers.create({
      email: eid
    }, function(err, customer) {
      //console.log(customer);
      if (customer != null && err == null) {
        res.status = 200
        res.end(JSON.stringify({id: customer.id}));
      } else {
        res.status = 500
        res.end();
      }
    });
  }
}

function charge(req, res) {
  if (req.method === "POST") {
    console.log("charge");
    console.log(req.headers);

    cus = req.headers["cus"]
    card = req.headers["card"]
    amount = req.headers["amount"]
    desc = req.headers["desc"]
    console.log(cus);
    console.log(card);
    console.log(amount);
    console.log(desc);

    stripe.charges.create({
      amount: amount,
      currency: "usd",
      description: desc,
      customer: cus,
      card: card
    }, function(err, charge) {
      console.log(charge);
      if (err != null) {
        console.log("CHARGE ERROR ===>>>");
        console.log(err);
      }
      
      if (charge != null && err == null) {
        res.status = 200
        res.end(JSON.stringify(charge));
      } else {
        res.status = 500
        res.end();
      }
    });
  }
}

function issueKeyHandler(req, res) {
  if (req.method === "POST") {
    api_version = req.headers["api_version"];
    cusId = req.headers["customerid"];
    console.log(api_version);
    console.log(cusId);
    if (!api_version || !cusId) {
      res.status = 500
      res.end();
      console.log("issueKeyHandler - error");
      return;
    }
    // This function assumes that some previous middleware has determined the
    // correct customerId for the session and saved it on the request object.
    console.log("issueKeyHandler");

    stripe.ephemeralKeys.create(
      {customer: cusId},
      {stripe_version: api_version}
    ).then((ekey) => {
      console.log(ekey);

      res.status = 200
      res.end(JSON.stringify(ekey));
    }).catch((err) => {
      console.log("error");

      res.status = 500
      res.end();
    });
  }
}
