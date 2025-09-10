import { chatAPI } from "../services/api";

export default function InstagramLoginButton() {
	async function handleClick() {
		const result = await chatAPI.login();
		console.log(result);
		window.location.href = result.authURL;
	}

	return (
		<button
			onClick={handleClick}
			className="w-full px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-lg hover:from-purple-600 hover:to-pink-600 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-all duration-200"
		>
			Log in with Instagram
		</button>
	);
}
