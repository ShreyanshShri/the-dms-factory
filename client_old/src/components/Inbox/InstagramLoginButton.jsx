import { chatAPI } from "../../services/api";
import "../../styles/inbox.css";

export default function InstagramLoginButton() {
	async function handleClick() {
		const result = await chatAPI.login();
		console.log(result);
		window.location.href = result.authURL;
	}
	return (
		<button className="ig-login-btn" onClick={handleClick}>
			Log in with Instagram
		</button>
	);
}
