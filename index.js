const express = require("express");
const app = express();
const cors = require("cors");
const admin = require("firebase-admin");
require("dotenv").config();
const { MongoClient } = require("mongodb");

const ObjectId = require("mongodb").ObjectId;

const port = process.env.PORT || 5000;

const serviceAccount = "{"type":"service_account","project_id":"bicycle-summit","private_key_id":"b1e919f0f1c0d36991144bb8febbfd7141966982","private_key":"-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCDJn5og7M1TTFO\nBPSxwMBRB3vNQbLAbDFIjuB5R8Js+KJZxDEKRaFJHsgxlNYwPtB8hH6gRHu97nt5\nVJBlKbggy6wU/GN3T/Mco6jnLaF5YZuDmA3Zr35suQNKJX2c+NnxM/kxruWCi7Nd\nr1X8iU/kpACJohGB8Pc87EjKXNhJd6EbVvF200xNDRPvTMJHkePAtFZf+cEIDHvX\nuwGxyvuilmELElCq1rdXDEbexq+CJl2DqKCDZmyi/BAk0XZvWCFNhXxSGjocymtD\nQzGoVwv8eAEqLq+yIjHImNwO+6FBFSAi8hOrqwfJpPBkKXx8ignYCx0N3ubnV53R\nBosfEI8fAgMBAAECggEAFRMDbwHysxbzXEkZlNKXVK3yK9ppwdfg13r2AScRy/bs\nB6aqBq+HqjtDCgyTmm8Ni2SzAEfg5nVC7A01orvgdYyk2z5vMUXsl+aIhpVjhCC2\nH6A4YYl8tDXKnIiHtcibJNIoMd6bzK1sJhq9o3XhG6lq2LLtQ0cYQ3bof3QJ4UwX\n+Baow1awGxFC4DVzJCTnIJvywq8NIJRvcG3uK3Yk/TWLy2hXcT+wpAE7vhx4sE1N\nAIMh9vKU6TeP2ZCgFI6tbkxzeR419DcHAYlFjiSQNA6KJldJhiGXOa+pcMBdAXEf\nWclTg1lnDU1hatlmi9zCMur4JZN6IUVq/mzVrvC1kQKBgQC5VQ+H+prjb9FjYYcc\np7y/rjpxsEJdi32+e74gwk0+f0jkxPF78dnR7YVnWbxCShZUUVYsc2Wv99vIq1Sn\nX+4SmJJ+8oeL9/qnroc9Tr5gpQ9Rq6ArutBIvFnRgV/Am24sREvEsSuFlkW4ZTCY\nZS4VjTxWIKHNa7//71lYX3W85wKBgQC1KIuzPUXduXDtm2bO734hud4JxE+RlfJu\nYdAinAF7z370XMf10T7G1rPTsnHwo9NUGQNQvUP0j2bxwd5k/qvQZymkb78K8ibV\niCKiXo10UI9bPdv9/O6+mObknuv7cMbNfNyVaPxA6dN/Egj5WvrcpbIXNOlJ43O6\n3KYSsKtdCQKBgQC2epogOQ/ogGCaiZyPClk+Ij5JUlMF6CKXOx+pAacssgcDuSZL\n84WUvVlsuV4zpt71hmBiw/yLlnBA1PE1G689gBw+Am6T0kZqc92U78NjRSIgN+wt\nInOSKmIFdmzhKCkCTPyNXiSME7nyJTAD3RvS/I08AEVQDZeuV+yQpu02YQKBgQCU\n3pzuzot7icijefEiXOzqCjPNEuXQXci7rOW9izYs6HcLmLM57poIDKf6b8nyVq5z\njZqL3vzZHH8cbJS1qhLHT/+Igcwc0qHXF+heRhU4YHtuH4eJUTFgr4YOmgqStjqo\n4tLidUPWlFCZO9jkET/V0tRm/bQ4ZBHWnTxcX5JzAQKBgBOFV37b3SkXkhCb5D0x\ng0K6qUfXBHA4KeGd01JQO7+8aiib//CGogpIvVHlZQjlyS2ZDYpucgjt/KP16P6v\ntzC4O/9Vp3e4wBxC8OPP+61u2WS1Zd05bJXrePgD99M0iSfbihfXzCYfec5TBUUc\n9VyS76UgGCGlGS5Txsr3gBng\n-----END PRIVATE KEY-----\n","client_email":"firebase-adminsdk-e432k@bicycle-summit.iam.gserviceaccount.com","client_id":"108415357583968586420","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-e432k%40bicycle-summit.iam.gserviceaccount.com"}";

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// middleware
app.use(cors());
app.use(express.json());

const uri = "mongodb+srv://hossen:5wHZkLDgtcn8nkBG@cluster0.wvjnf.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";

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

    //DELETE API

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
