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

// utilities
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

const randInteger = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const randArrayItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

// generate users with offers
const userGenerator = async () => {
  try {
    for (i = 1; i <= 6; i++) {
      // creates 6 users
      // create user with hash & everything
      const password = "azerty";
      const salt = uid2(16);
      const hash = SHA256(password + salt).toString(encBase64);
      const token = uid2(16);

      const newUser = new User({
        email: faker.internet.email(),
        account: {
          username: faker.internet.userName(),
          phone: faker.phone.phoneNumber(),
        },
        token,
        hash,
        salt,
      });
      // user avatar
      const imageUrl = faker.image.avatar();
      const cloudinaryResponse = await cloudinary.uploader.upload(imageUrl, {
        folder: `vinted/users/${newUser._id}`,
      });
      newUser.account.avatar = cloudinaryResponse;
      await newUser.save();
      // create offers for the user
      const limit = randInteger(1, 5);
      await offerGenerator(newUser.id, limit);
      // when finished creating users + offers
      console.log(`***User ${i} : ${limit} offers created***`);
    }
  } catch (error) {
    console.log("USER => ", error);
  }
};

const offerGenerator = async (userId, limitOffers) => {
  try {
    for (i = 1; i <= limitOffers; i++) {
      const clothesItem = randArrayItem(clothes);
      const size = randInteger(36, 46);
      const brand = randArrayItem(brands);
      const city = randArrayItem(cities);
      const condition = randArrayItem(conditions);
      const color = faker.commerce.color();
      const price = randInteger(1, 400);
      const name = `${color} ${clothesItem}, size ${size} - condition ${condition}`;
      // initialize new offer
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
    }
  } catch (error) {
    console.log("OFFER => ", error);
  }
};

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

//clean db and create fake data
mongoose
  .connect("mongodb://localhost/vinted", {
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
