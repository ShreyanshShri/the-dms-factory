import Layout from "../components/Layout";
import { Outlet } from "react-router-dom";

function Dashboard() {
	return (
		<Layout withPadding={true}>
			<Outlet /> {/* child routes render here */}
		</Layout>
	);
}

export default Dashboard;
