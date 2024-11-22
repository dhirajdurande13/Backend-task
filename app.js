const express = require("express");
const axios = require("axios");
const app = express();
const PORT = 5500;
const mongoose=require('mongoose');
const cors = require('cors');
app.use(cors());

app.use(cors({
    origin: 'http://127.0.0.1:5500'  // Only allow this origin
  }));

//   mongodb connection
let url="mongodb://localhost:27017/productsDB";
mongoose
  .connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected db"))
  .catch((error) => console.error("connection error:", error));

// schema

const productSchema = new mongoose.Schema({
    id: { type: Number, unique: true },
    title: String,
    price: Number,
    category: String,
    sold: Boolean,
    dateOfSale: Date,
  });


//   creating model

const Product = mongoose.model("Product", productSchema);

// api-1 to initialize db

app.get("/initialize", async (req, res) => {
    try {
      await Product.deleteMany();
      const apiUrl = "https://s3.amazonaws.com/roxiler.com/product_transaction.json";
      const response = await axios.get(apiUrl);
      // Insert data
      await Product.insertMany(response.data);
        res.send({ message: "db initialized with inserting data" });
    
    } catch (error) {
      console.error("Error initializing database:", error.message);
      res.send({ error: "Failed to initialize db" });
    }
  });

  // API-2 to list all transactions
app.get("/transactions", async (req, res) => {
    const { search = "", page = 1, perPage = 10 } = req.query;
  
    try {
      
      const searchQuery = search
        ? {
            $or: [
              { title: { $regex: search, $options: "i" } },
              { description: { $regex: search, $options: "i" } },
              { price: isNaN(Number(search)) ? null : Number(search) }, // Convert price to string
            ].filter(Boolean),
          }
        : {};
  
      // Pagination setup to limit search or reduce unwanted search used limit and skip
      const limit = parseInt(perPage);
      const skip = (parseInt(page) - 1) * limit;
  
      
      const transactions = await Product.find(searchQuery).skip(skip).limit(limit);
  
      
      const total = await Product.countDocuments(searchQuery);
  
      res.send({
        page: parseInt(page),
        perPage: limit,
        total,
        transactions,
      });
    } catch (error) {
      console.error("Error fetching transactions:", error.message);
      res.send({ error: "Failed to fetch transactions" });
    }
  });


//   API-3 for statistics
app.get("/statistics", async (req, res) => {
    const { month } = req.query;
  
    if (!month || month < 1 || month > 12) {
      return res.send({ error: "Invalid month. Please provide a valid month between 1 and 12." });
    }
  
    try {
      
      const result = await Product.aggregate([
        {
          // Match documents where the month of the dateOfSale is equal to the provided month
          $match: {
            $expr: { $eq: [{ $month: "$dateOfSale" }, parseInt(month)] }
          }
        },
        {
          // Group by null to calculate total sale amount, sold items, and not sold items
          $group: {
            _id: null,
            totalSaleAmount: {
              $sum: {
                $cond: [{ $eq: ["$sold", true] }, "$price", 0] // sum of  price of sold itmms
              }
            },
            totalSoldItems: {
              $sum: {
                $cond: [{ $eq: ["$sold", true] }, 1, 0] // Count sold items
              }
            },
            totalNotSoldItems: {
              $sum: {
                $cond: [{ $eq: ["$sold", false] }, 1, 0] // Count not sold items
              }
            }
          }
        }
      ]);
  
      if (result.length === 0) {
        return res.send({ message: "No transactions found for the selected month." });
      }
      
      if (result && result.length > 0) {
        const { totalSaleAmount, totalSoldItems, totalNotSoldItems } = result[0];
  
        // Send the statistics in a structured response
        res.send({
          statistics: {
            totalSaleAmount,
            totalSoldItems,
            totalNotSoldItems,
          },
        });
      } else {
        // Handle case where no data is found
        res.send({
          statistics: {
            totalSaleAmount: 0,
            totalSoldItems: 0,
            totalNotSoldItems: 0,
          },
        });
      }
     
    } catch (error) {
      console.error("Error fetching statistics:", error);
      res.status(500).send({ error: "Failed to fetch statistics" });
    }
  });

  

//   API-4 for bar chart
app.get("/barChart", async (req, res) => {
    const { month } = req.query;
  
    if (!month || month < 1 || month > 12) {
      return res.send({ error: "Invalid month. Please provide a valid month between 1 and 12." });
    }
  
    try {
      
      const result = await Product.aggregate([
        {
          // Match transactions for the given month
          $match: {
            $expr: { $eq: [{ $month: "$dateOfSale" }, parseInt(month)] },
          },
        },
        {
          // Group by price range
          $project: {
            priceRange: {
              $switch: {
                branches: [
                  { case: { $lte: ["$price", 100] }, then: "0-100" },
                  { case: { $and: [{ $gt: ["$price", 100] }, { $lte: ["$price", 200] }] }, then: "101-200" },
                  { case: { $and: [{ $gt: ["$price", 200] }, { $lte: ["$price", 300] }] }, then: "201-300" },
                  { case: { $and: [{ $gt: ["$price", 300] }, { $lte: ["$price", 400] }] }, then: "301-400" },
                  { case: { $and: [{ $gt: ["$price", 400] }, { $lte: ["$price", 500] }] }, then: "401-500" },
                  { case: { $and: [{ $gt: ["$price", 500] }, { $lte: ["$price", 600] }] }, then: "501-600" },
                  { case: { $and: [{ $gt: ["$price", 600] }, { $lte: ["$price", 700] }] }, then: "601-700" },
                  { case: { $and: [{ $gt: ["$price", 700] }, { $lte: ["$price", 800] }] }, then: "701-800" },
                  { case: { $and: [{ $gt: ["$price", 800] }, { $lte: ["$price", 900] }] }, then: "801-900" },
                  { case: { $gt: ["$price", 900] }, then: "901+" }
                ],
                default: "Other",
              },
            },
          },
        },
        {
          // Group by priceRange and count the items in each range
          $group: {
            _id: "$priceRange",
            count: { $sum: 1 },
          },
        },
        {
          // Sort the result by the predefined price ranges
          $sort: {
            _id: 1,
          },
        },
      ]);
  
      // Send the results in a format suitable for a bar chart
      res.send({
        data: result.map(item => ({
          priceRange: item._id,
          itemCount: item.count,
        })),
      });
    } catch (error) {
      console.error("Error generating bar chart:", error);
      res.send({ error: "Failed to generate bar chart" });
    }
  });
 
//   API-5 for pieChart
app.get("/pieChart", async (req, res) => {
    const { month } = req.query;
  
    if (!month || month < 1 || month > 12) {
      return res.send({ error: "Invalid month. Please provide a valid month between 1 and 12." });
    }
  
    try {
      
      const result = await Product.aggregate([
        {
          
          $match: {
            $expr: { $eq: [{ $month: "$dateOfSale" }, parseInt(month)] },
          },
        },
        {
          
          $group: {
            _id: "$category",
            itemCount: { $sum: 1 },
          },
        },
        {
          
          $sort: {
            itemCount: -1, // Sort by item count in descending order
          },
        },
      ]);
  
      // Send the results in a format suitable for a pie chart
      res.send({
        data: result.map(item => ({
          category: item._id,
          itemCount: item.itemCount,
        })),
      });
    } catch (error) {
      console.error("Error generating pie chart:", error);
      res.send({ error: "Failed to generate pie chart" });
    }
  });
//   API-6 combined API
app.get("/combinedAPI", async (req, res) => {
    const { month } = req.query;
  
    if (!month || month < 1 || month > 12) {
      return res.send({ error: "Invalid month. Please provide a valid month between 1 and 12." });
    }
  
    try {
      
      const statistics = await Product.aggregate([
        {
          
          $match: {
            $expr: { $eq: [{ $month: "$dateOfSale" }, parseInt(month)] },
          },
        },
        {
          
          $group: {
            _id: "$sold",
            totalSaleAmount: { $sum: { $cond: [{ $eq: ["$sold", true] }, "$price", 0] } },
            totalSoldItems: { $sum: { $cond: [{ $eq: ["$sold", true] }, 1, 0] } },
            totalNotSoldItems: { $sum: { $cond: [{ $eq: ["$sold", false] }, 1, 0] } },
          },
        },
      ]);
  
      const totalSold = statistics.find(stat => stat._id === true) || {};
      const totalNotSold = statistics.find(stat => stat._id === false) || {};
  
      
      const totalSaleAmount = totalSold.totalSaleAmount || 0;
      const totalSoldItems = totalSold.totalSoldItems || 0;
      const totalNotSoldItems = totalNotSold.totalNotSoldItems || 0;
  
      // Fetch Pie Chart Data
      const pieChartData = await Product.aggregate([
        {
          
          $match: {
            $expr: { $eq: [{ $month: "$dateOfSale" }, parseInt(month)] },
          },
        },
        {
          
          $group: {
            _id: "$category",
            itemCount: { $sum: 1 },
          },
        },
      ]);
  
      // Fetch Bar Chart Data 
      const barChartData = await Product.aggregate([
        {
          
          $match: {
            $expr: { $eq: [{ $month: "$dateOfSale" }, parseInt(month)] },
          },
        },
        {
          
          $project: {
            priceRange: {
              $switch: {
                branches: [
                  { case: { $lte: ["$price", 100] }, then: "0-100" },
                  { case: { $lte: ["$price", 200] }, then: "101-200" },
                  { case: { $lte: ["$price", 300] }, then: "201-300" },
                  { case: { $lte: ["$price", 400] }, then: "301-400" },
                  { case: { $lte: ["$price", 500] }, then: "401-500" },
                  { case: { $lte: ["$price", 600] }, then: "501-600" },
                  { case: { $lte: ["$price", 700] }, then: "601-700" },
                  { case: { $lte: ["$price", 800] }, then: "701-800" },
                  { case: { $lte: ["$price", 900] }, then: "801-900" },
                  { case: { $gt: ["$price", 900] }, then: "901-above" },
                ],
                default: "Unknown",
              },
            },
          },
        },
        {
          
          $group: {
            _id: "$priceRange",
            itemCount: { $sum: 1 },
          },
        },
      ]);
  
      // Combine all data into one response
      const combinedResponse = {
        statistics: {
          totalSaleAmount,
          totalSoldItems,
          totalNotSoldItems,
        },
        pieChartData: pieChartData.map(item => ({
          category: item._id,
          itemCount: item.itemCount,
        })),
        barChartData: barChartData.map(item => ({
          priceRange: item._id,
          itemCount: item.itemCount,
        })),
      };
  
      res.send(combinedResponse);
    } catch (error) {
      console.error("Error fetching combined data:", error);
      res.send({ error: "Failed to fetch combined data" });
    }
  });
  
app.listen(PORT,()=>{
    console.log("Server running");

})
