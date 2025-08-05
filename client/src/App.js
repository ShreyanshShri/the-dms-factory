import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import IndexPage from "./components/Index/Index";
import Login from "./components/Auth/Login";
import Register from "./components/Auth/Register";
import Dashboard from "./components/Dashboard/Dashboard";
import CreateCampaign from "./components/Campaign/CreateCampaign";
import CampaignInfo from "./components/Campaign/CampaignInfo";
import CampaignEdit from "./components/Campaign/CampaignEdit";
import ManageAccounts from "./components/Dashboard/ManageAccounts";
import ProtectedRoute from "./components/Auth/ProtectedRoute";
import Layout from "./components/Layout/Layout";
import "./styles/globals.css";

function App() {
	return (
		<AuthProvider>
			<Router>
				<Layout>
					<Routes>
						<Route path="/" element={<IndexPage />} />
						<Route path="/login" element={<Login />} />
						<Route path="/register" element={<Register />} />
						<Route
							path="/dashboard"
							element={
								<ProtectedRoute>
									<Dashboard />
								</ProtectedRoute>
							}
						/>
						<Route
							path="/create-campaign"
							element={
								<ProtectedRoute>
									<CreateCampaign />
								</ProtectedRoute>
							}
						/>
						<Route
							path="/campaign/:campaignId"
							element={
								<ProtectedRoute>
									<CampaignInfo />
								</ProtectedRoute>
							}
						/>
						<Route
							path="/campaign/edit/:campaignId"
							element={
								<ProtectedRoute>
									<CampaignEdit />
								</ProtectedRoute>
							}
						/>
						<Route
							path="/manage-accounts"
							element={
								<ProtectedRoute>
									<ManageAccounts />
								</ProtectedRoute>
							}
						/>
					</Routes>
				</Layout>
			</Router>
		</AuthProvider>
	);
}

export default App;
