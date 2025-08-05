import { Link } from "react-router-dom";
import "../../styles/index.css";

export default function IndexPage() {
	return (
		<div className="dmf-landing-page">
			<header className="dmf-header">
				<h1 className="dmf-logo">The DM Factory</h1>
				<nav className="dmf-nav">
					<Link to="/login">Dashboard</Link>
					<Link to="/docs">Docs</Link>
				</nav>
			</header>

			<main className="dmf-hero">
				<div className="container">
					<h2 className="hero-title">Automate Instagram DMs with Precision</h2>
					<p className="hero-subtitle">
						The DM Factory helps you scale engagement through intelligent,
						account-based direct messaging — without getting banned or blocked.
					</p>
					<div className="hero-actions">
						<Link to="/login" className="hero-btn primary">
							Start Campaign
						</Link>
						<Link to="/docs" className="hero-btn secondary">
							Explore Features
						</Link>
					</div>
				</div>
			</main>

			<section className="dmf-features container">
				<div className="feature-card">
					<h3>Smart Campaign Control</h3>
					<p>
						Start, pause, or stop DMs per account or per campaign with real-time
						status sync.
					</p>
				</div>
				<div className="feature-card">
					<h3>Safe Automation</h3>
					<p>
						Throttled message limits and working hours to mimic human behavior
						and stay undetected.
					</p>
				</div>
				<div className="feature-card">
					<h3>Lead Management</h3>
					<p>
						Upload lead lists or use tags to segment your messages and reuse
						them effortlessly.
					</p>
				</div>
				<div className="feature-card">
					<h3>Multi-Device Extension</h3>
					<p>
						Use multiple browser extensions as “wizards” that work in sync
						across campaigns.
					</p>
				</div>
			</section>

			<section className="dmf-how-it-works container">
				<h2 className="section-title">How It Works</h2>
				<div className="how-steps">
					<div className="how-step">
						<h4>1. Add Your IG Accounts</h4>
						<p>
							Connect multiple Instagram accounts securely through the browser
							extension.
						</p>
					</div>
					<div className="how-step">
						<h4>2. Create a DM Campaign</h4>
						<p>
							Upload or paste your lead list, write variants, and configure
							schedule limits.
						</p>
					</div>
					<div className="how-step">
						<h4>3. Launch & Monitor</h4>
						<p>
							Start the campaign. Real-time updates let you track each message
							and reply.
						</p>
					</div>
				</div>
			</section>

			<section className="dmf-testimonials container">
				<h2 className="section-title">What Users Are Saying</h2>
				<div className="testimonial-cards">
					<div className="testimonial">
						<p>
							"We've doubled our outreach while staying compliant with
							Instagram's limits. This tool is a must-have."
						</p>
						<span>— Raj, Growth Hacker</span>
					</div>
					<div className="testimonial">
						<p>
							"Clean UI, intuitive logic, and real-time control. Honestly,
							better than most paid SaaS."
						</p>
						<span>— Kritika, Freelance Marketer</span>
					</div>
					<div className="testimonial">
						<p>
							"The wizard extension model is genius. We run this across 30+
							accounts without stress."
						</p>
						<span>— Aryan, Agency Owner</span>
					</div>
				</div>
			</section>

			<section className="dmf-final-cta container">
				<h2>Ready to Scale Your DM Campaigns?</h2>
				<p>
					Start for free. Use your own browser and accounts. No API limits, no
					nonsense.
				</p>
				<Link to="/login" className="hero-btn primary">
					Launch The DM Factory
				</Link>
			</section>

			<footer className="dmf-footer">
				<div className="container">
					<p>
						© {new Date().getFullYear()} The DM Factory. All rights reserved.
					</p>
				</div>
			</footer>
		</div>
	);
}
