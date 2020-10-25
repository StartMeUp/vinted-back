require("dotenv").config();
// packages
const faker = require("faker");
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const uid2 = require("uid2");

// import models
const Offer = require("./models/Offer");
const User = require("./models/User");

// *********
// utilities and functions
// *********
const clothes = [
  "trousers",
  "skirt",
  "shoes",
  "jumper",
  "socks",
  "shirt",
  "sneakers",
];
const brands = ["Nike", "Adidas", "Zara", "BOSS"];
const cities = ["Paris", "Lille", "London", "Tokyo"];
const conditions = ["new", "old", "OK"];

// return a number between min and max
const randInteger = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// pick random element of an array
const randArrayItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

// generate users
const usersIds = []; // store users'ids to create offers later

const userGenerator = async () => {
  try {
    // loop creates 8 users
    for (i = 1; i <= 8; i++) {
      // create user with hash & everything
      const password = "azerty"; // all users have this password
      const salt = uid2(16);
      const hash = SHA256(password + salt).toString(encBase64);
      const token = uid2(16);

      const newUser = new User({
        email: faker.internet.email().toLocaleLowerCase(),
        account: {
          username: faker.internet.userName(),
          phone: faker.phone.phoneNumber("07########"),
        },
        token,
        hash,
        salt,
      });

      // user avatar image
      const imageUrl = faker.image.avatar();
      const cloudinaryResponse = await cloudinary.uploader.upload(imageUrl, {
        folder: `vinted/users/${newUser._id}`,
      });
      newUser.account.avatar = cloudinaryResponse;

      // push newUser's id in array
      usersIds.push(newUser._id);

      // save newUser
      await newUser.save();

      // notification in console
      console.log(`***User ${i} created ***`);
    }
    console.log("Users' ids => ", usersIds);
  } catch (error) {
    console.log("USER => ", error);
  }
};

// generate offers
const offerGenerator = async () => {
  try {
    console.log("Creating offers ... Please wait, it will take some time ....");
    const limit = 50; // number of offers to create
    for (i = 1; i <= limit; i++) {
      const userId = randArrayItem(usersIds);
      const clothesItem = randArrayItem(clothes);
      const size = randInteger(36, 46);
      const brand = randArrayItem(brands);
      const city = randArrayItem(cities);
      const condition = randArrayItem(conditions);
      const color = faker.commerce.color();
      const price = randInteger(1, 400);
      const name = `${color} ${clothesItem}, size ${size} - condition ${condition}`;
      // create new offer
      const newOffer = new Offer({
        owner: userId,
        product_name: name,
        product_description: faker.lorem.sentence(),
        product_price: price,
        product_details: [
          { MARQUE: brand },
          { TAILLE: size },
          { ÉTAT: condition },
          { COULEUR: color },
          { EMPLACEMENT: city },
        ],
      });
      // offer picture
      const imageUrl = faker.image.fashion();
      const cloudinaryResponse = await cloudinary.uploader.upload(imageUrl, {
        folder: `vinted/offers/${newOffer._id}`,
      });
      newOffer.product_image = cloudinaryResponse;
      // save offer
      await newOffer.save();
      // notification when half the offers have been created
      if (i >= limit / 2 && i < limit / 2 + 1)
        console.log(i, "offers created, half created ...");
    }
  } catch (error) {
    console.log("OFFER => ", error);
  }
};

// to delete existing collections (if no collections, will fail and script continues)
const dropCollections = async (db, collections) => {
  for await (const collection of collections) {
    try {
      await db.dropCollection(collection);
      console.log(`Collection ${collection} dropped.`);
    } catch (err) {
      console.error("#dropCollection ERROR: ", err);
    }
  }
};

// *******
//clean db and create fake data
// *******
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
  })
  .then(async () => {
    const db = mongoose.connection;
    console.log("ready to drop collections");
    try {
      await dropCollections(db, ["users", "offers"]);
      await userGenerator();
      await offerGenerator();
      console.log("Success ! All users and offers created");
    } catch (err) {
      throw err;
    }
  })
  .then(() => {
    console.log("ready to close connection");
    mongoose.connection.close();
    console.log("connection closed");
  })
  .catch((err) => console.log(err));
