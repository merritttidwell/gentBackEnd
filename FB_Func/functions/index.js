const functions = require('firebase-functions');
var stripeProd = require("stripe")(functions.config().stripe.token);//("sk_test_Qc3frsXwp1sA8KnQSXC1SU6i");
var stripeDev = require("stripe")("sk_test_Qc3frsXwp1sA8KnQSXC1SU6i");

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

/*exports.bigben = functions.https.onRequest((req, res) => {
    const hours = (new Date().getHours() % 12) + 1 // london is UTC + 1hr;
    res.status(200).send(`<!doctype html>
      <head>
        <title>Time</title>
      </head>
      <body>
        ${'BONG '.repeat(hours)}
      </body>
    </html>`);
  });*/

exports.trigger_user_created = functions.database.ref("/users/{uid}").onCreate(event => {
    // Grab the current value of what was written to the Realtime Database.
    const original = event.data.val();
    console.log(original);
    //console.log('Uppercasing', event.params.pushId, original);
    //const uppercase = original.toUpperCase();
    // You must return a Promise when performing asynchronous tasks inside a Functions such as
    // writing to the Firebase Realtime Database.
    // Setting an "uppercase" sibling in the Realtime Database returns a Promise.
    //return event.data.ref.parent.child('uppercase').set(uppercase);
    return event.data.ref.child('credit').set('125.0');
  });

exports.ephemeral_keys_prod = functions.https.onRequest((req, res) => {
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

    stripeProd.ephemeralKeys.create(
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
});

exports.ephemeral_keys_dev = functions.https.onRequest((req, res) => {
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

    stripeDev.ephemeralKeys.create(
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
});

exports.create_customer_prod = functions.https.onRequest((req,res) => {
  if (req.method === "POST") {
    console.log("createCustomer");
    eid = req.headers["email"]
    console.log(eid);

    stripeProd.customers.create({
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
});

exports.create_customer_dev = functions.https.onRequest((req,res) => {
  if (req.method === "POST") {
    console.log("createCustomer");
    eid = req.headers["email"]
    console.log(eid);

    stripeDev.customers.create({
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
});

exports.create_customer_with_card_dev = functions.https.onRequest((req,res) => {
  if (req.method === "POST") {
    console.log("createCustomerWithCard");
    eid = req.headers["email"]
    src = req.headers["source"]
    iChrg = parseInt(req.headers["ichrg"], 10);
    mChrg = parseInt(req.headers["mchrg"], 10);
    console.log(eid);
    console.log(src);
    console.log(iChrg);
    console.log(mChrg);

    stripeDev.customers.create({
      email: eid,
      source: src
    }).then(function(customer) {
      return stripeDev.charges.create({
        amount: iChrg - mChrg,
        currency: 'usd',
        customer: customer.id
      });
    }).then(function(charge) {
      return stripeDev.subscriptions.create({
        customer: charge.customer,
        items: [{plan: 'GentsBasicPlan'}],
      });
    }).then(function(subscription) {
      console.log(subscription)
      res.status = 200
      res.end(JSON.stringify({id: subscription.customer}));

    }).catch(function(err) {
      // Deal with an error
      res.status = 500
      res.end();
    });
  }
});

exports.create_customer_with_card_prod = functions.https.onRequest((req,res) => {
  if (req.method === "POST") {
    console.log("createCustomerWithCard");
    eid = req.headers["email"]
    src = req.headers["source"]
    console.log(eid);
    console.log(src);

    stripeProd.customers.create({
      email: eid,
      source: src,
    }, function(err, customer) {
      if (customer != null && err == null) {
        //res.status = 200
        //res.end(JSON.stringify({id: customer.id}));
        //cid = customer.id

        stripeProd.subscriptions.create({
          customer: customer.id,
          items: [{plan: "GentsBasicPlan"}],
        });
        res.status = 200
        res.end(JSON.stringify({id: customer.id}));
      } else {
        res.status = 500
        res.end();
      }
    });
  }
});

exports.charge_prod = functions.https.onRequest((req,res) => {
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

    stripeProd.charges.create({
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
});

exports.charge_dev = functions.https.onRequest((req,res) => {
  if (req.method === "POST") {
    console.log(req.headers);

    cus = req.headers["cus"]
    card = req.headers["card"]
    amount = req.headers["amount"]
    desc = req.headers["desc"]
    console.log(cus);
    console.log(card);
    console.log(amount);
    console.log(desc);

    stripeDev.charges.create({
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
});
