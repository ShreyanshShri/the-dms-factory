import { useEffect } from "react";
import { chatAPI } from "../services/api";

const ManageInstagramAccounts = () => {
	useEffect(() => {
		const p = async () => {
			const res = await chatAPI.getInstagramAccounts();
			console.log(res);
		};
		try {
			p();
		} catch (error) {
			console.log(error);
		}
	}, []);
	return <div id="ManageInstagramAccounts">ManageInstagramAccounts</div>;
};

export default ManageInstagramAccounts;
