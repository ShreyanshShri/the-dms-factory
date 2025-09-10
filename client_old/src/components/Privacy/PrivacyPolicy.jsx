import "../../styles/privacyPolicy.css";
import Footer from "../utils/Footer";

export default function PrivacyPolicy() {
	return (
		<>
			<div className="privacy-page">
				<div className="privacy-container">
					<h1>Privacy Policy</h1>

					<p>
						Thank you for choosing Buildfluence, a unified inbox and customer
						relationship management (CRM) platform. This Privacy Policy explains
						how Buildfluence LLC ("we," "us," or "our") collects, uses,
						processes, and protects your personal information when you use our
						services.
					</p>

					<p>
						<strong>Meta Platform Compliance:</strong> Our unified inbox and CRM
						system operates in full compliance with Meta's Business Platform
						Policies, Instagram Basic Display API requirements, and Facebook
						Platform Policies. We adhere to all data handling standards required
						for applications that integrate with Meta's messaging and business
						tools.
					</p>

					<h2>1. Definitions</h2>
					<p>
						<strong>"Service"</strong> refers to Buildfluence's unified inbox
						and CRM platform, including our website, mobile applications, and
						all related features.
					</p>
					<p>
						<strong>"Customer Data"</strong> means information submitted to our
						platform by account holders, including contact information,
						conversation history, and CRM records.
					</p>
					<p>
						<strong>"User"</strong> means individuals who have registered
						accounts and actively use our platform features.
					</p>

					<h2>2. Information We Collect</h2>
					<p>
						When you create a Buildfluence account, we collect your name, email
						address, business information, and authentication credentials
						necessary for account setup and security.
					</p>
					<p>
						Our unified inbox processes messages, conversation threads, and
						communication metadata to provide centralized message management.
						This includes timestamps, sender/recipient information, and message
						content necessary for CRM functionality.
					</p>
					<p>
						We collect and process customer interaction data, sales pipeline
						information, contact management records, and business analytics data
						that you input or generate through platform usage.
					</p>
					<p>
						When you connect external services (including Meta Business
						platforms, email providers, or other communication tools) to
						Buildfluence, we access and process data necessary for integration
						functionality, strictly within the scope of permissions you grant.
					</p>

					<h2>3. How We Use Your Information</h2>
					<p>
						We use collected information to operate our unified inbox and CRM
						features, including message routing, conversation management,
						customer relationship tracking, and business analytics generation.
					</p>
					<p>
						For Meta platform integrations, we process data solely to provide
						user-requested features such as Instagram message management and
						Facebook business communication tools. We comply with Meta's Limited
						Use Policy and do not use this data for advertising purposes or
						unauthorized third-party sharing.
					</p>
					<p>
						We analyze aggregated, anonymized usage patterns to enhance platform
						functionality, develop new features, and improve user experience
						while maintaining individual privacy.
					</p>

					<h2>4. Information Sharing and Disclosure</h2>
					<p>
						We do not sell or rent your personal information. Information
						sharing is limited to trusted third-party service providers who
						assist with platform operations, data processing, or customer
						support, under strict confidentiality agreements and data protection
						requirements.
					</p>
					<p>
						When required by law, legal process, or to protect our rights,
						users' safety, or platform security, we may disclose information to
						appropriate authorities.
					</p>
					<p>
						In case of merger, acquisition, or business transfer, user
						information may be transferred as part of business assets, with
						continued privacy protection under substantially similar terms.
					</p>

					<h2>5. Your Rights and Choices</h2>
					<p>
						You can access, update, correct, or delete your account information
						through platform settings. For additional data requests, contact our
						support team.
					</p>
					<p>
						You control communication preferences and can opt out of promotional
						messages while continuing to receive essential service
						notifications.
					</p>
					<p>
						You can disconnect third-party integrations (including Meta
						platforms) at any time through account settings, which will stop
						future data processing from those sources.
					</p>

					<h2>6. Data Security and Protection</h2>
					<p>
						We implement comprehensive security measures including encryption,
						access controls, regular security assessments, and compliance
						monitoring to protect your information. Our infrastructure meets
						industry standards for data protection and includes specific
						safeguards for Meta platform data handling.
					</p>
					<p>
						While we maintain robust security practices, no system is completely
						immune to risks. We continuously monitor and improve our security
						measures to provide maximum protection.
					</p>

					<h2>7. Data Retention</h2>
					<p>
						We retain information as long as necessary to provide services,
						comply with legal obligations, and fulfill legitimate business
						purposes. When data is no longer needed, we securely delete or
						anonymize it according to established retention schedules.
					</p>

					<h2>8. International Data Transfers</h2>
					<p>
						Buildfluence operates globally and may transfer data internationally
						to provide services. We ensure appropriate safeguards are in place
						for international transfers and comply with applicable data
						protection regulations including GDPR and similar frameworks.
					</p>

					<h2>9. Children's Privacy</h2>
					<p>
						Buildfluence is designed for business use and is not intended for
						individuals under 16 years of age. We do not knowingly collect
						personal information from children under 16 without proper parental
						consent.
					</p>

					<h2>10. Policy Updates</h2>
					<p>
						We may update this Privacy Policy periodically to reflect service
						changes, legal requirements, or improved practices. Significant
						changes will be communicated through platform notifications or
						email, and continued use indicates acceptance of updated terms.
					</p>

					<h2>11. Contact Information</h2>
					<p>
						For questions, concerns, or requests regarding this Privacy Policy
						or your personal information, please contact us at:{" "}
						<strong>support@buildfluence.com</strong>
					</p>
					<p>
						Business Name: <strong>Buildfluence LLC</strong>
					</p>

					<p className="last-updated">
						Last updated: {new Date().toLocaleDateString()}
					</p>
				</div>
			</div>
			<Footer />
		</>
	);
}
