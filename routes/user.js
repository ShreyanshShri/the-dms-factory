const express = require("express");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

router.use(authenticateToken);

router.get("/payment-status", async (req, res) => {
	res.status(200).json({
		success: true,
		subscriptionStatus: req.user.subscriptionStatus,
	});
});

module.exports = router;
