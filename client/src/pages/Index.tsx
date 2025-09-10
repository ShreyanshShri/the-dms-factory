import { Link } from "react-router-dom";
import "../styles/index.css";

const Index = () => {
	return (
		<div id="index">
			<header className="header">
				<nav className="nav">
					<div className="logo">Buildfluence</div>
					<ul className="nav-links">
						<li>
							<a href="#features">Features</a>
						</li>
						<li>
							<a href="#pricing">Pricing</a>
						</li>
						<li>
							<a href="#reviews">Reviews</a>
						</li>
					</ul>
					<Link to="/login" className="cta-button">
						Get Started
					</Link>
				</nav>
			</header>

			<section className="hero">
				<div className="hero-content">
					<div className="hero-badge">
						{/* <span>Send 50 DMs/Day For Free</span> */}
					</div>
					<h1 className="hero-title">
						{/* Turn Cold Outreach Into Clients on Autopilot */}
						Manage Instagram Conversations with Ease
					</h1>
					<p className="hero-description">
						{/* Scale your pipeline with AI-powered Cold DMs that find, qualify, and
						convert leads—so you focus on closing deals, not chasing them */}
						Streamline your Costumer Relationship management with our
						easy-to-use platform.
					</p>
					<Link to="/login" className="hero-button">
						Start Free Trial
					</Link>
				</div>
				<div className="hero-image">
					<img
						src="https://framerusercontent.com/images/JSakO3iDpBY0uvb9cOV7x278fQM.png"
						alt="Buildfluence Dashboard"
					/>
				</div>
				<div className="hero-bg-shape">
					<img
						src="https://framerusercontent.com/images/0pkkUPiiBy68AdWhcnSLJijrCvQ.svg"
						alt="Background Shape"
					/>
				</div>
			</section>

			<section className="brand-section">
				<div className="brand-content">
					<p className="brand-title">
						Trusted by{" "}
						<strong>top SAAS, agencies, and entrepreneurs worldwide</strong>
					</p>
					<div className="brand-logos">
						<div className="brand-logo">
							<img
								src="https://framerusercontent.com/images/NRfKXq6QSssXzPVwh2f9BVaSfHM.svg"
								alt="Brand 1"
							/>
						</div>
						<div className="brand-logo">
							<img
								src="https://framerusercontent.com/images/VD18GFUi569ZjbTmkE4Gaf4wO1U.svg"
								alt="Brand 2"
							/>
						</div>
						<div className="brand-logo">
							<img
								src="https://framerusercontent.com/images/8DeGxzvY0rbsiJVjiRmUgWOHao.svg"
								alt="Brand 3"
							/>
						</div>
						<div className="brand-logo">
							<img
								src="https://framerusercontent.com/images/Y0sX7FMoYwLcaHk7TPrlyjznEw.svg"
								alt="Brand 4"
							/>
						</div>
						<div className="brand-logo">
							<img
								src="https://framerusercontent.com/images/mj4kLxXydnHlERfGT4bh5ypC8U.svg"
								alt="Brand 5"
							/>
						</div>
					</div>
				</div>
			</section>

			<section className="about-section">
				<div className="about-content">
					<div className="about-text">
						<h3>
							<strong>We Help You Scale Without the Grind</strong>
						</h3>
						<p>
							Stop wasting hours sending manual messages. Buildfluence automates
							your outreach so you can:
						</p>
					</div>
					<div className="about-cards">
						<div className="about-card">
							<div className="about-card-icon">
								<img
									src="https://framerusercontent.com/images/YZtjBfZ0cBhwUl5Q25jjkjZ1ASc.svg"
									alt="Icon"
								/>
							</div>
							<h4>Fill your calendar with qualified calls</h4>
							<p>
								{/* Let AI handle the outreach and follow-ups while you focus on */}
								Let AI handle the follow-ups while you focus on closing deals.
								Buildfluence keeps your pipeline full with real prospects who
								actually want to talk.
							</p>
						</div>
						<div className="about-card">
							<div className="about-card-icon">
								<img
									src="https://framerusercontent.com/images/YZtjBfZ0cBhwUl5Q25jjkjZ1ASc.svg"
									alt="Icon"
								/>
							</div>
							<h4>Target the right audience instantly</h4>
							<p>
								{/* No more guesswork. Use Buildfluence's smart filters and
								lead-sourcing tools to connect with your{" "}
								<strong>ideal clients</strong> in seconds. */}
								No more juggling between the inbox and your calendar. Use
								Buildfluence's smart filters and tools to connect with your{" "}
								<strong>ideal clients</strong> in seconds.
							</p>
						</div>
					</div>
				</div>
			</section>

			<section className="features-section" id="features">
				<div className="features-content">
					<div className="section-header">
						<h2>Get Connected Faster</h2>
						<p>
							{/* Our AI outreach engine helps you cut through the noise, land in */}
							Our AI outreach engine helps you cut through the noise, land in
							the right inboxes, and spark real conversations.
						</p>
					</div>
					<div className="features-grid">
						<div className="feature-card">
							<h3>Seamless Automation</h3>
							<p>
								Connect with thousands of prospects on Instagram and Twitter (X)
								through AI-powered automation and a unified inbox.
							</p>
							<div className="feature-stats">
								<div className="feature-stat-number">200%</div>
								<div className="feature-stat-text">Faster Integration</div>
							</div>
						</div>
						{/* <div className="feature-card">
							<h3>Your AI-Powered DM Setter</h3>
							<p>
								From getting leads to sending follow-ups, our integrated AI
								handles the heavy lifting. Users have already booked{" "}
								<strong>2x more meetings</strong> and cut manual work by{" "}
								<strong>80%</strong>.
							</p>
							<div className="feature-stats">
								<div className="feature-stat-number">120k+</div>
								<div className="feature-stat-text">
									Happy customers worldwide
								</div>
							</div>
						</div> */}
					</div>
				</div>
			</section>

			<section className="core-features-section">
				<div className="core-features-content">
					<div className="core-features-header">
						<h2>How Buildfluence Works?</h2>
						<p>
							Designed to Simplify Your Experience and Maximize the Benefits of
							CloudPeak's Innovative Features
						</p>
					</div>
					<div className="core-features-list">
						<div className="core-feature">
							<div className="core-feature-image">
								<img
									src="https://framerusercontent.com/images/uC5t2RyWcIiCzuVogtJEIyJrc.svg"
									alt="Find Prospects"
								/>
							</div>
							<div className="core-feature-content">
								<h2>Find Prospects That Matter</h2>
								<p>
									<strong>
										Know your ideal prospects? Import your lists and launch
										campaigns instantly. Don't have any? Our tool can find them
										for you—or we'll handle it.
									</strong>
								</p>
								<Link to="/login" className="core-feature-button">
									Get Started
								</Link>
							</div>
						</div>
						{/* <div className="core-feature">
							<div className="core-feature-image">
								<img
									src="https://framerusercontent.com/images/T2XWd3JDcA0zUzD6bi7g9DNo7g.svg"
									alt="Launch Campaigns"
								/>
							</div>
							<div className="core-feature-content">
								<h2>Launch Human-Like DM Campaigns</h2>
								<p>
									Launch personalized outreach sequences that sound authentic.
									From first message to follow-ups, every DM feels natural,
									boosting reply rates and building real conversations.
								</p>
								<Link to="/login" className="core-feature-button">
									Try Today
								</Link>
							</div>
						</div> */}
						{/* <div className="core-feature">
							<div className="core-feature-image">
								<img
									src="https://framerusercontent.com/images/zLXAoOtJ383xmTfVCM7atAwY5VA.svg"
									alt="Manage Dashboard"
								/>
							</div>
							<div className="core-feature-content">
								<h2>
									Manage & Close in One Dashboard — or Let AI Do It For You
								</h2>
								<p>
									Keep track of every reply, conversation, and conversion in a
									unified inbox. Or hand it over to the AI DM Setter, which
									follows up, nurtures leads, and moves conversations toward
									booked calls automatically.
								</p>
								<Link to="/login" className="core-feature-button">
									Start Sending
								</Link>
							</div>
						</div> */}
					</div>
				</div>
			</section>

			<section className="pricing-section" id="pricing">
				<div className="pricing-content">
					<div className="pricing-header">
						<h2>Choose A Plan</h2>
						<p>
							Designed to Simplify Your Experience and Maximize the Benefits of
							CloudPeak's Innovative Features
						</p>
					</div>
					{/* <div className="pricing-toggle">
						<span>Monthly</span>
						<div className="toggle-switch"></div>
						<span className="active">Yearly</span>
					</div> */}
					<div className="pricing-cards">
						<div className="pricing-card">
							<h3>Basic</h3>
							<p className="subtitle">For Slow Scaling</p>
							<div className="price">$55</div>
							<p className="price-subtitle">
								per person, per month For Both Instagram and X
							</p>
							<ul className="pricing-features">
								{/* <li>Unlimited Accounts</li> */}
								{/* <li>Unlimited Campaigns</li> */}
								{/* <li>Send 10,000 DMs/Day</li> */}
								<li>Comprehensive Dashboard</li>
								<li>Dedicated Support</li>
								<li>Elite Community</li>
							</ul>
							<Link to="/login" className="pricing-button">
								Get Started for Free
							</Link>
						</div>
						<div className="pricing-card featured">
							<div className="popular-badge">Most Popular</div>
							<h3>Premium</h3>
							<p className="subtitle">Best For Starting</p>
							<div className="price">$97</div>
							{/* <p className="price-subtitle">
								per person, per month For Both Instagram and X
							</p> */}
							<ul className="pricing-features">
								<li>Everything In Basic plan</li>
								<li>Unified Inbox to handle multiple Accounts</li>
								<li>Comprehensive Dashboard</li>
								<li>Dedicated Support</li>
								<li>Elite Community</li>
							</ul>
							<Link to="/login" className="pricing-button">
								Get Started for Free
							</Link>
						</div>
						<div className="pricing-card">
							<h3>Standard</h3>
							<p className="subtitle">For Maximum Results</p>
							<div className="price">$149</div>
							{/* <p className="price-subtitle">
								per person, per month For Both Instagram and X
							</p> */}
							<ul className="pricing-features">
								<li>Everything in Premium Plan</li>
								<li>Dedicated AI DM Setter</li>
								<li>Dedicated Support</li>
								<li>Elite Community</li>
							</ul>
							<Link to="/login" className="pricing-button">
								Get Started for Free
							</Link>
						</div>
					</div>
				</div>
			</section>

			<section className="testimonials-section" id="reviews">
				<div className="testimonials-content">
					<div className="testimonials-header">
						<h2>Trusted by 1200+ users</h2>
						<p>
							Sharing Their Successes and Transformative Experiences with
							Buildfluence's Powerful AI SAAS Solutions
						</p>
					</div>
					{/* <div className="testimonials-grid">
						<div className="testimonial-card">
							<p className="testimonial-text">
								"I used to hate cold outreach 'cause it felt spammy. With
								Buildfluence, my DMs actually sound human. People are replying,
								and I booked 4 new clients last month. Crazy ROI."
							</p>
							<div className="testimonial-author">
								<div className="testimonial-avatar">
									<img
										src="https://framerusercontent.com/images/eDob9dCIl1Gl9vu7UmnWBMzKI.jpg"
										alt="Sarah Taranian"
									/>
								</div>
								<div className="testimonial-info">
									<h4>Sarah Taranian</h4>
									<p>Creative Agency</p>
								</div>
							</div>
						</div>
						<div className="testimonial-card">
							<p className="testimonial-text">
								"I went from manually sending 50 DMs a day to booking 6 calls in
								my first week… all while chilling. Buildfluence is like having
								an intern that never sleeps."
							</p>
							<div className="testimonial-author">
								<div className="testimonial-avatar">
									<img
										src="https://framerusercontent.com/images/80cSf51vznokzM44ZvySMsxkWjE.jpg"
										alt="Emily Hudson"
									/>
								</div>
								<div className="testimonial-info">
									<h4>Emily Hudson</h4>
									<p>Marketing Agency</p>
								</div>
							</div>
						</div>
						<div className="testimonial-card">
							<p className="testimonial-text">
								"this is the first DM tool that didn't get my accounts flagged.
								I scaled to 1k+ DMs/day safely and locked in 12 meetings in 2
								weeks. Absolute game-changer."
							</p>
							<div className="testimonial-author">
								<div className="testimonial-avatar">
									<img
										src="https://framerusercontent.com/images/ocuc7j8FeCKMvkJwnfXvnofJc.jpg"
										alt="John Depp"
									/>
								</div>
								<div className="testimonial-info">
									<h4>John Depp</h4>
									<p>Course Seller</p>
								</div>
							</div>
						</div>
						<div className="testimonial-card">
							<p className="testimonial-text">
								"Buildfluence basically gave me back my evenings. The AI handles
								all the follow-ups, and I just jump in when people are ready to
								talk. Feels like cheating"
							</p>
							<div className="testimonial-author">
								<div className="testimonial-avatar">
									<img
										src="https://framerusercontent.com/images/3b8QuAx2Cb8H9BulsjLzSM5Jqss.jpg"
										alt="David Megan"
									/>
								</div>
								<div className="testimonial-info">
									<h4>David Megan</h4>
									<p>Affiliate Marketer</p>
								</div>
							</div>
						</div>
						<div className="testimonial-card">
							<p className="testimonial-text">
								"I was skeptical at first, but it WORKS. Booked my first $2k
								client in 10 days using this. If you're not automating, you're
								wasting time"
							</p>
							<div className="testimonial-author">
								<div className="testimonial-avatar">
									<img
										src="https://framerusercontent.com/images/iFuswefZ1RQ9td8i2xp0uuXbFSg.jpg"
										alt="Mark Logan"
									/>
								</div>
								<div className="testimonial-info">
									<h4>Mark Logan</h4>
									<p>Real Estate Agency</p>
								</div>
							</div>
						</div>
						<div className="testimonial-card">
							<p className="testimonial-text">
								"I thought Buildfluence would be another overhyped SaaS. But fr,
								it's wild. I wake up to replies and booked calls without
								touching my phone. It's like my DMs run themselves."
							</p>
							<div className="testimonial-author">
								<div className="testimonial-avatar">
									<img
										src="https://framerusercontent.com/images/hCnsK8rc82TnJXAWSVth7bBVqkE.jpg"
										alt="David Chen"
									/>
								</div>
								<div className="testimonial-info">
									<h4>David Chen</h4>
									<p>Course Seller</p>
								</div>
							</div>
						</div>
					</div> */}
				</div>
			</section>

			<section className="faq-section">
				<div className="faq-content">
					<div className="faq-header">
						<h2>Common Questions</h2>
						<p>Haven't found what you're looking for? Contact us</p>
					</div>
					<div className="faq-list">
						<div className="faq-item active">
							<button className="faq-question">
								What is Buildfluence?
								<svg
									className="faq-icon"
									viewBox="0 0 24 24"
									fill="currentColor"
								>
									<path d="M7 14l5-5 5 5z" />
								</svg>
							</button>
							<div className="faq-answer">
								<p>
									{/* Buildfluence is an AI-powered outreach platform that automates
									Instagram & Twitter/X DMs. It works like a virtual DM
									setter—finding leads, sending personalized messages, following
									up, and tracking results in one dashboard. */}
									Buildfluence is an AI-powered platform that automates Costumer
									Relationship Management (CRM). It works like a virtual DM
									setter—finding leads, sending personalized messages, following
									up, and tracking results in one dashboard.
								</p>
							</div>
						</div>
						<div className="faq-item">
							<button className="faq-question">
								Is Buildfluence safe to use?
								<svg
									className="faq-icon"
									viewBox="0 0 24 24"
									width="24"
									height="24"
								>
									<path
										d="M19 9l-7 7-7-7"
										stroke="currentColor"
										stroke-width="2"
										fill="none"
										stroke-linecap="round"
										stroke-linejoin="round"
									/>
								</svg>
							</button>
							<div className="faq-answer">
								<p>
									Yes, Buildfluence is completely safe. We use human-like
									sending patterns and built-in safety features to protect your
									accounts from being flagged. Our users have successfully
									scaled to 1000+ DMs per day without any account issues.
								</p>
							</div>
						</div>

						<div className="faq-item">
							<button className="faq-question">
								Can I connect multiple accounts?
								<svg
									className="faq-icon"
									viewBox="0 0 24 24"
									width="24"
									height="24"
								>
									<path
										d="M19 9l-7 7-7-7"
										stroke="currentColor"
										stroke-width="2"
										fill="none"
										stroke-linecap="round"
										stroke-linejoin="round"
									/>
								</svg>
							</button>
							<div className="faq-answer">
								<p>
									Absolutely! All our plans support unlimited accounts for both
									Instagram and Twitter/X. You can manage multiple social media
									accounts from one unified dashboard.
								</p>
							</div>
						</div>

						<div className="faq-item">
							<button className="faq-question">
								Who is Buildfluence for?
								<svg
									className="faq-icon"
									viewBox="0 0 24 24"
									width="24"
									height="24"
								>
									<path
										d="M19 9l-7 7-7-7"
										stroke="currentColor"
										stroke-width="2"
										fill="none"
										stroke-linecap="round"
										stroke-linejoin="round"
									/>
								</svg>
							</button>
							<div className="faq-answer">
								<p>
									Buildfluence is perfect for agencies, course creators,
									affiliate marketers, real estate agents, consultants, and any
									business owner who wants to scale their outreach and generate
									more leads through social media DMs.
								</p>
							</div>
						</div>

						<div className="faq-item">
							<button className="faq-question">
								Do I need technical skills to use Buildfluence?
								<svg
									className="faq-icon"
									viewBox="0 0 24 24"
									width="24"
									height="24"
								>
									<path
										d="M19 9l-7 7-7-7"
										stroke="currentColor"
										stroke-width="2"
										fill="none"
										stroke-linecap="round"
										stroke-linejoin="round"
									/>
								</svg>
							</button>
							<div className="faq-answer">
								<p>
									Not at all! Buildfluence is designed to be user-friendly.
									Simply connect your accounts, import your leads or let us find
									them, create your message templates, and launch your
									campaigns. No coding or technical expertise required.
								</p>
							</div>
						</div>

						<div className="faq-item">
							<button className="faq-question">
								What platforms does Buildfluence support?
								<svg
									className="faq-icon"
									viewBox="0 0 24 24"
									width="24"
									height="24"
								>
									<path
										d="M19 9l-7 7-7-7"
										stroke="currentColor"
										stroke-width="2"
										fill="none"
										stroke-linecap="round"
										stroke-linejoin="round"
									/>
								</svg>
							</button>
							<div className="faq-answer">
								<p>
									Currently, Buildfluence supports Instagram and Twitter/X for
									automated DM campaigns. We're working on expanding to other
									platforms based on user demand.
								</p>
							</div>
						</div>
					</div>
				</div>
			</section>
			<footer className="footer">
				<div className="footer-content">
					<div className="footer-top">
						<div className="footer-left">
							<div className="footer-divider"></div>
							<div className="footer-logo">Buildfluence</div>
							<div className="footer-description">
								Solutions that drive success and propel your business forward
							</div>
						</div>
					</div>
					<div className="footer-bottom">
						Copyright © 2024 Buildfluence. <br />
						All Rights Reserved
					</div>
				</div>
			</footer>
		</div>
	);
};

export default Index;
