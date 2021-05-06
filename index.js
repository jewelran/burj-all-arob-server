const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const admin = require("firebase-admin");
const MongoClient = require("mongodb").MongoClient;

require('dotenv').config()
// console.log(process.env.DB_PASS);
const uri =
  `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.bbimo.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const port = 5000;

const app = express();
app.use(cors());
app.use(bodyParser.json());

var serviceAccount = require("./config/buruj-al-arob-firebase-adminsdk-z9s7d-85c29061f5.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL:process.env.FIRE_DB ,
});


const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
client.connect((err) => {
  const bookingsCollection = client.db("burjAlArab").collection("bookings");
  app.post("/addBooking", (req, res) => {
    const newBooking = req.body;
    bookingsCollection.insertOne(newBooking).then((result) => {
      res.send(result.insertedCount > 0);
      // console.log(result);
    });

    // console.log(newBooking);
  });

  app.get("/bookings", (req, res) => {
    // console.log(req.headers.authorization);
    const bearer = req.headers.authorization;
    if (bearer && bearer.startsWith("bearer ")) {
      const idToken = bearer.split(" ")[1];
      // console.log({ idToken });
      admin
        .auth()
        .verifyIdToken(idToken)
        .then(function (decodedToken) {
          const tokenEmail = decodedToken.email;
          const queryEmail = req.query.email;
            // console.log(tokenEmail, queryEmail);
          if (tokenEmail == queryEmail) {
            bookingsCollection
              .find({ email: req.query.email })
              .toArray((err, document) => {
                res.status(200).send(document);
              });
          }

          else{
            res.status(401).send('un-Authorize access')
          }
         
        })
        .catch((error) => {
          // Handle error
          res.status(401).send('un-Authorize access')
        });
    }

    else{
      res.status(401).send('un-Authorize access')
    }

    // console.log(req.query.email);
  });
});

// app.get("/", (req, res) => {
//   res.send("Hello World!");
// });

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
