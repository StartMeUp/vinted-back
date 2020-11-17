require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
app.use(cors());

// cloudinary
const cloudinary = require("cloudinary").v2;
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// middleware
const formidable = require("express-formidable");
app.use(formidable());

// Mongodb
const mongoose = require("mongoose");
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
});

// routes
const userRoutes = require("./routes/userRoutes");
app.use(userRoutes);

const offerRoutes = require("./routes/offerRoutes");
app.use(offerRoutes);

const PaymentRoutes = require("./routes/PaymentRoutes");
app.use(PaymentRoutes);

app.all("*", (req, res) => {
  res.status(404).json({ message: "page not found" });
});

// run server
app.listen(process.env.PORT || 3000, () => {
  console.log("server running ...");
});
