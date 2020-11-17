const express = require("express");
const router = express.Router();
const stripe = require("stripe")(process.env.STRIPE_TEST_SECRET_KEY);

router.post("/payment", async (req, res) => {
  try {
    const stripeToken = req.fields.stripeToken;

    const response = await stripe.charges.create({
      amount: req.fields.product_price,
      currency: "eur",
      description: product_name,
      source: stripeToken,
      customer: req.fields.username,
    });

    console.log(response.status);

    res.json(response);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
