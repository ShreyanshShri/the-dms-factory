import { Link } from "react-router-dom"; // If using React

import "../../styles/footer.css";

export default function Footer() {
	return (
		<footer className="dmf-footer">
			<span>© 2025 Buildfluence LLC. All rights reserved.</span>
			<span className="footer-separator">•</span>
			<Link to="/privacy-policy">Privacy Policy</Link>
		</footer>
	);
}
