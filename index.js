const express = require("express");
const app = express();
const cors = require("cors");
const admin = require("firebase-admin");
require("dotenv").config();
const { MongoClient } = require("mongodb");

const ObjectId = require("mongodb").ObjectId;

const port = process.env.PORT || 5000;

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// middleware
app.use(cors());
app.use(express.json());

const uri = process.env.URI;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function verifyToken(req, res, next) {
  if (req.headers?.authorization?.startsWith("Bearer ")) {
    const token = req.headers.authorization.split(" ")[1];

    try {
      const decodedUser = await admin.auth().verifyIdToken(token);
      req.decodedEmail = decodedUser.email;
    } catch {}
  }
  next();
}

async function run() {
  try {
    await client.connect();
    const database = client.db("bicycle");
    const productCollection = database.collection("products");
    const reviewCollection = database.collection("reviews");
    const orderCollection = database.collection("orders");
    const usersCollection = database.collection("users");

    //GET Products API
    app.get("/products", async (req, res) => {
      const cursor = await productCollection.find({});
      const products = await cursor.toArray();
      res.send(products);
    });
    // lOAD SINLE Product PACKAGE WITH ID
    app.get("/product/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const singleProduct = await productCollection.findOne(query);
      // console.log('load user with id: ', id);
      res.send(singleProduct);
    });
    //GET Reviews API
    app.get("/reviews", async (req, res) => {
      const cursor = await reviewCollection.find({});
      const reviews = await cursor.toArray();
      res.send(reviews);
    });

    // POST Orders API
    app.post("/orders", async (req, res) => {
      const order = req.body;
      const result = await orderCollection.insertOne(order);
      res.json(result);
    });

    // POST Single Review API
    app.post("/reviews", async (req, res) => {
      const review = req.body;
      const result = await reviewCollection.insertOne(review);
      res.json(result);
    });
    // Add Orders API
    app.post("/products", async (req, res) => {
      const product = req.body;
      const result = await productCollection.insertOne(product);
      console.log(result);
      res.json(result);
    });
    // Checking is user are Admin
    app.get("/users/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      let isAdmin = false;
      if (user?.role === "admin") {
        isAdmin = true;
      }
      res.json({ admin: isAdmin });
    });

    // GET All User Orders
    app.get("/myOrders", async (req, res) => {
      const result = await orderCollection.find({}).toArray();
      res.send(result);
    });
    // GET Single User Orders
    app.get("/myOrders/:email", async (req, res) => {
      const result = await orderCollection
        .find({ email: req.params.email })
        .toArray();
      res.send(result);
    });

    app.delete("/deleteProduct/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await productCollection.deleteOne(query);

      console.log("deleting user with id ", result);

      res.json(result);
    });

    // USER POST API
    app.post("/users", async (req, res) => {
      const user = req.body;
      console.log(user);
      const result = await usersCollection.insertOne(user);
      console.log(result);
      res.json(result);
    });
    // USER UPDATE API
    app.put("/users", async (req, res) => {
      const user = req.body;
      const filter = { email: user.email };
      const options = { upsert: true };
      const updateDoc = { $set: user };
      const result = await usersCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.json(result);
    });
    // Update Order Status
    app.put("/updateStatus/:id", (req, res) => {
      const id = req.params.id;
      const updatedStatus = req.body.status;
      console.log(updatedStatus);
      const filter = { _id: ObjectId(id) };
      console.log(updatedStatus);
      orderCollection
        .updateOne(filter, {
          $set: { status: updatedStatus },
        })
        .then((result) => {
          res.send(result);
        });
    });

    app.put("/users/admin", verifyToken, async (req, res) => {
      const user = req.body;
      const requester = req.decodedEmail;
      if (requester) {
        const requesterAccount = await usersCollection.findOne({
          email: requester,
        });
        if (requesterAccount.role === "admin") {
          const filter = { email: user.email };
          const updateDoc = { $set: { role: "admin" } };
          const result = await usersCollection.updateOne(filter, updateDoc);
          res.json(result);
        }
      } else {
        res
          .status(403)
          .json({ message: "you do not have access to make admin" });
      }
    });
  } finally {
    // await client.close();
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Server is running!");
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
