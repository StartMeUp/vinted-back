// Initialize routing
const express = require("express");
const router = express.Router();

// require encryption packages
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const uid2 = require("uid2");

// Models
const User = require("../models/User");
const Offer = require("../models/Offer");

// Routes
router.post("/user/signup", async (req, res) => {
  try {
    const { email, username, phone, password } = req.fields;
    // if => check for errors first, else => create user
    if (!username || !password || !email) {
      const checkParams = () => {
        let str = "";
        if (!username) str += " username";
        if (!email) str += " email";
        if (!password) str += " password";
        return str;
      };
      res
        .status(400)
        .json({ message: `Missing parameter(s):${checkParams()}.` });
    } else if (await User.findOne({ email })) {
      res.status(409).json({ message: "Email already exists" });
    } else {
      // declare encryption variables
      const salt = uid2(16);
      const hash = SHA256(password + salt).toString(encBase64);
      const token = uid2(16);
      // create user
      const newUser = new User({
        email,
        account: { username, phone },
        salt,
        hash,
        token,
      });
      await newUser.save();
      // send response to client
      res.status(200).json({
        _id: newUser._id,
        account: newUser.account,
        token: newUser.token,
        email: newUser.email,
      });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post("/user/login", async (req, res) => {
  try {
    // get & restructure body data
    const { email, password } = req.fields;
    // get user from DB
    const user = await User.findOne({ email });
    // check and athenticate
    if (!user) {
      res.status(400).json({ message: "email doesn't exist" });
    } else {
      const testHash = SHA256(password + user.salt).toString(encBase64);
      if (testHash === user.hash) {
        res.status(200).json({
          _id: user.id,
          token: user.token,
          account: {
            username: user.account.username,
            phone: user.account.phone,
          },
        });
      } else {
        res.status(401).json({ message: "wrong password !" });
      }
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
