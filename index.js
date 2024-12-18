const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://food-connect-platform.web.app",
      "https://food-connect-platform.firebaseapp.com",
    ],
    credentials: true,
  })
);

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.yiash.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const foodCollection = client.db("foodConnectDb").collection("foods");
    const requestCollection = client.db("foodConnectDb").collection("requests");
    const popularCollection = client.db("foodConnectDb").collection("popular");

    // GET all foods
    app.get("/foods", async (req, res) => {
      const cursor = foodCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    // POST a new food
    app.post("/foods", async (req, res) => {
      const newFood = req.body;
      try {
        const result = await foodCollection.insertOne(newFood);
        res.status(201).send(result);
        console.log(result);
      } catch (error) {
        res.status(500).send({ error: "Failed to add food" });
      }
    });

    // PUT a food
    app.put("/foods/:id", async (req, res) => {
      const foodId = req.params.id;
      const updatedFood = req.body;

      try {
        if (!ObjectId.isValid(foodId)) {
          return res.status(400).send({ error: "Invalid food ID" });
        }

        const result = await foodCollection.updateOne(
          { _id: new ObjectId(foodId) },
          {
            $set: {
              foodName: updatedFood.foodName,
              quantity: updatedFood.quantity,
              pickupLocation: updatedFood.pickupLocation,
            },
          }
        );

        if (result.matchedCount > 0) {
          res.send({ message: "Food not found" });
        }
      } catch (error) {
        console.error("Error updateFood", error);
        res.status(500).send({ error: "Failed to update food" });
      }
    });

    // GET a single food by ID
    app.get("/foods/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };

      const result = await foodCollection.findOne(query);
      res.send(result);
      console.log(result);
    });

    // PUT to update food status to requested
    app.put("/foods/:id/request", async (req, res) => {
      const { id } = req.params;
      const requestDetails = req.body;

      try {
        const result = await foodCollection.updateOne(
          { _id: new ObjectId(id) },
          {
            $set: {
              status: "requested",
              requestDetails,
            },
          }
        );
        if (result.modifiedCount > 0) {
          res.send({
            success: true,
            message: "Food status update to requested",
          });
        } else {
          res.status(404).send({ error: "Food not found" });
        }
      } catch (error) {
        res.status(500).send({ error: "Failed to update food status" });
      }
    });

    // DELETE a food
    app.delete("/foods/:id", async (req, res) => {
      const id = req.params.id;

      try {
        const query = { _id: new ObjectId(id) };

        const result = await foodCollection.deleteOne(query);

        if (result.deletedCount > 0) {
          res.send({
            success: true,
            message: "Food deleted successfully",
            result,
          });
        } else {
          res.status(404).send({ success: false, error: "Food not found" });
        }
      } catch (error) {
        console.error("Error deleting food:", error);
        res
          .status(500)
          .send({ success: false, error: "Failed to delete food" });
      }
    });

    // POST request to submit a food request
    app.post("/requests", async (req, res) => {
      const requestData = req.body;

      try {
        const result = await requestCollection.insertOne(requestData);
        res.status(201).send({
          success: true,
          message: "Food request submitted successfully!",
          result,
        });
      } catch (error) {
        console.error("Error submitting food request:", error);
        res.status(500).send({ error: "Failed to submit food request" });
      }
    });

    // GET all requests
    app.get("/requests", async (req, res) => {
      try {
        const cursor = requestCollection.find();
        const result = await cursor.toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "Failed to fetch request" });
      }
    });

    // Get only available foods
    app.get("/foods-available", async (req, res) => {
      try {
        const query = { foodStatus: "available" };
        const availableFoods = await foodCollection.find(query).toArray();
        res.send(availableFoods);
      } catch (error) {
        res.status(500).send({ error: "Failed to fetch available foods" });
      }
    });

    // GET request for popular items
    app.get("/popular", async (req, res) => {
      const cursor = popularCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    // GET a single food by ID
    app.get("/popular/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };

      const result = await popularCollection.findOne(query);
      res.send(result);
      console.log(result);
    });

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Food Connect is Running");
});

app.listen(port, () => {
  console.log(`Food Connect Server is Running on Port ${port}`);
});
