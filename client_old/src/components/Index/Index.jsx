import { Link } from "react-router-dom";
import Footer from "../utils/Footer";
import "../../styles/index.css";

export default function IndexPage() {
	return (
		<div className="dmf-landing-page">
			<header className="dmf-header">
				<h1 className="dmf-logo">BuildFluence</h1>
				<nav className="dmf-nav">
					<Link to="/login">Dashboard</Link>
					<Link to="/docs">Docs</Link>
				</nav>
			</header>

			<main className="dmf-hero">
				<div className="container">
					<h2 className="hero-title">
						Manage Instagram Conversations with Ease
					</h2>
					<p className="hero-subtitle">
						BuildFluence helps you centralize, organize, and respond to messages
						across multiple accounts — all in one place.
					</p>
					<div className="hero-actions">
						<Link to="/login" className="hero-btn primary">
							Go to Inbox
						</Link>
						<Link to="/docs" className="hero-btn secondary">
							Explore Features
						</Link>
					</div>
				</div>
			</main>

			<section className="dmf-features container">
				<div className="feature-card">
					<h3>Unified Inbox</h3>
					<p>
						View and reply to all your Instagram conversations in one clean,
						organized dashboard.
					</p>
				</div>
				<div className="feature-card">
					<h3>Team Collaboration</h3>
					<p>
						Assign conversations, add notes, and work with your team to manage
						leads effectively.
					</p>
				</div>
				<div className="feature-card">
					<h3>Lead Management</h3>
					<p>
						Tag, segment, and track customer interactions so you never lose
						context in follow-ups.
					</p>
				</div>
				<div className="feature-card">
					<h3>Multi-Account Support</h3>
					<p>
						Connect multiple Instagram business accounts and switch between them
						seamlessly.
					</p>
				</div>
			</section>

			<section className="dmf-how-it-works container">
				<h2 className="section-title">How It Works</h2>
				<div className="how-steps">
					<div className="how-step">
						<h4>1. Connect Your IG Accounts</h4>
						<p>
							Securely log in with Instagram and bring all your accounts into
							one workspace.
						</p>
					</div>
					<div className="how-step">
						<h4>2. Organize Conversations</h4>
						<p>
							Tag chats, assign teammates, and keep track of every interaction
							in your pipeline.
						</p>
					</div>
					<div className="how-step">
						<h4>3. Respond & Track</h4>
						<p>
							Reply directly from the dashboard, monitor responses, and keep
							your team in sync.
						</p>
					</div>
				</div>
			</section>

			<section className="dmf-testimonials container">
				<h2 className="section-title">What Users Are Saying</h2>
				<div className="testimonial-cards">
					<div className="testimonial">
						<p>
							"Our team finally has one place to manage all Instagram messages.
							No more switching accounts."
						</p>
						<span>— Raj, Growth Manager</span>
					</div>
					<div className="testimonial">
						<p>
							"The shared inbox is a game changer. Assigning conversations makes
							client handling so smooth."
						</p>
						<span>— Kritika, Social Media Manager</span>
					</div>
					<div className="testimonial">
						<p>
							"We scaled to 20+ accounts and BuildFluence keeps everything
							organized and secure."
						</p>
						<span>— Aryan, Agency Owner</span>
					</div>
				</div>
			</section>

			<section className="dmf-final-cta container">
				<h2>Ready to Simplify Your Instagram Inbox?</h2>
				<p>
					Centralize your messages, manage leads, and collaborate with your team
					from one dashboard.
				</p>
				<Link to="/login" className="hero-btn primary">
					Get Started
				</Link>
			</section>
			<Footer />
		</div>
	);
}
