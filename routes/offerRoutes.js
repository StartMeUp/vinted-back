const express = require("express");
const isAuthenticated = require("../middlewares/isAuthenticated");
const router = express.Router();

// cloudinary
const cloudinary = require("cloudinary").v2;
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Models
const User = require("../models/User");
const Offer = require("../models/Offer");

// routes
router.get("/offers", async (req, res) => {
  try {
    let {
      title = "",
      priceMin = 1,
      priceMax = 100000,
      sort = "desc",
      page = 1,
    } = req.query;

    sort === "price-asc" ? (sort = "asc") : (sort = "desc");

    const resultsPerPage = 20;
    let count = 0;

    const search = await Offer.find(
      {
        product_price: { $gte: priceMin, $lte: priceMax },
        product_name: new RegExp(title, "i"),
      },
      (err, result) => {
        if (!err) count = result.length;
      }
    )
      .limit(resultsPerPage)
      .skip((page - 1) * resultsPerPage)
      .sort({ product_price: sort });

    res.json({ count, offers: search });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/offer/publish", isAuthenticated, async (req, res) => {
  try {
    // destructure body fields
    const {
      title,
      description,
      price,
      condition,
      city,
      brand,
      size,
      color,
    } = req.fields;
    // create offer
    const newOffer = new Offer({
      product_name: title,
      product_description: description,
      product_price: price,
      owner: req.user.id,
      product_details: [
        { condition },
        { city },
        { brand },
        { size },
        { color },
      ],
    });
    // upload picture
    const pictureToUpload = req.files.picture.path;
    const cloudinaryResponse = await cloudinary.uploader.upload(
      pictureToUpload,
      {
        folder: `/vinted/offers/${newOffer.id}`,
      }
    );
    newOffer.product_image = cloudinaryResponse;
    // save offer
    await newOffer.save();
    // response
    res.status(200).json(newOffer);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/offer/:id", async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id).populate({
      path: "owner",
      select: "account _id",
    });
    res.json(offer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
