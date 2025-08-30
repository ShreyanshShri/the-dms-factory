import "../../styles/privacyPolicy.css";

export default function PrivacyPolicy() {
	return (
		<div className="privacy-page">
			<div className="privacy-container">
				<h1>Privacy Policy</h1>

				<p>
					Your privacy is important to us. This Privacy Policy explains how we
					collect, use, and protect your information when you use our services.
				</p>

				<h2>1. Information We Collect</h2>
				<p>
					We may collect personal information you provide (such as name, email,
					and account details) as well as non-personal information (such as
					device type, usage data, and cookies).
				</p>

				<h2>2. How We Use Information</h2>
				<p>
					We use collected information to provide and improve our services,
					personalize your experience, ensure security, and comply with legal
					obligations.
				</p>

				<h2>3. Data Sharing</h2>
				<p>
					We do not sell your personal data. Information may be shared only when
					legally required.
				</p>

				<h2>4. Data Security</h2>
				<p>
					We take reasonable measures to protect your data. However, no method
					of transmission or storage is 100% secure.
				</p>

				<h2>5. Your Rights</h2>
				<p>
					You have the right to access, correct, or delete your data. You may
					also withdraw consent for certain processing activities.
				</p>

				<h2>6. Changes to This Policy</h2>
				<p>
					We may update this Privacy Policy from time to time. Significant
					changes will be communicated, and your continued use of the service
					means acceptance of the updated policy.
				</p>

				<p className="last-updated">
					Last updated: {new Date().toLocaleDateString()}
				</p>
			</div>
		</div>
	);
}
