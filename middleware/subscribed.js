const subscribed = async (req, res, next) => {
	if (req.user.isSubscribed) {
		next();
	} else {
		return res.status(403).json({ success: false, message: "Not subscribed" });
	}
};

module.exports = { subscribed };
