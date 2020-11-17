const express = require("express");
const router = express.Router();
const stripe = require("stripe")(process.env.STRIPE_TEST_SECRET_KEY);

router.post("/payment", async (req, res) => {
  try {
    const stripeToken = req.fields.stripeToken;
    const total = Number(parseInt(req.fields.total).toFixed(2)) * 100;

    const response = await stripe.charges.create({
      amount: total,
      currency: "eur",
      description: req.fields.product_name,
      source: stripeToken,
    });

    console.log(response.status);

    res.json(response);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
