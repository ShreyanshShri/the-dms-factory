import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { AdminProvider } from "./context/AdminContext";
import IndexPage from "./components/Index/Index";
import Login from "./components/Auth/Login";
import Register from "./components/Auth/Register";
import Dashboard from "./components/Dashboard/Dashboard";
// import CreateCampaign from "./components/Campaign/CreateCampaign";
// import CampaignInfo from "./components/Campaign/CampaignInfo";
// import CampaignEdit from "./components/Campaign/CampaignEdit";
// import ManageAccounts from "./components/Dashboard/ManageAccounts";
import AdminDashboard from "./components/Dashboard/AdminDashboard";
import PaymentPortal from "./components/Payment/PaymentPortal";
import PaymentProcessing from "./components/Payment/PaymentProcessing";
import Inbox from "./components/Inbox/Inbox";
import CRM from "./components/CRM/CRM";
import ProtectedRoute from "./components/Auth/ProtectedRoute";
import Layout from "./components/Layout/Layout";
import "./styles/globals.css";

function App() {
	return (
		<AuthProvider>
			<AdminProvider>
				<Router>
					<Routes>
						<Route path="/" element={<IndexPage />} />
						<Route path="/login" element={<Login />} />
						<Route path="/register" element={<Register />} />
						<Route
							path="/dashboard"
							element={
								<ProtectedRoute>
									<Layout>
										<Dashboard />
									</Layout>
								</ProtectedRoute>
							}
						/>
						{/* <Route
							path="/create-campaign"
							element={
								<ProtectedRoute>
									<Layout>
										<CreateCampaign />
									</Layout>
								</ProtectedRoute>
							}
						/>
						<Route
							path="/campaign/:campaignId"
							element={
								<ProtectedRoute>
									<Layout>
										<CampaignInfo />
									</Layout>
								</ProtectedRoute>
							}
						/>
						<Route
							path="/campaign/edit/:campaignId"
							element={
								<ProtectedRoute>
									<Layout>
										<CampaignEdit />
									</Layout>
								</ProtectedRoute>
							}
						/>
						<Route
							path="/manage-accounts"
							element={
								<ProtectedRoute>
									<Layout>
										<ManageAccounts />
									</Layout>
								</ProtectedRoute>
							}
						/> */}
						<Route
							path="/inbox"
							element={
								<ProtectedRoute>
									{/* No padding here */}
									<Layout withPadding={false}>
										<Inbox />
									</Layout>
								</ProtectedRoute>
							}
						/>
						<Route
							path="/crm"
							element={
								<ProtectedRoute>
									{/* No padding here */}
									<Layout withPadding={false}>
										<CRM />
									</Layout>
								</ProtectedRoute>
							}
						/>
						<Route
							path="/admin"
							element={
								<ProtectedRoute requireAdmin={true}>
									<Layout>
										<AdminDashboard />
									</Layout>
								</ProtectedRoute>
							}
						/>
						<Route
							path="/payment"
							element={
								<ProtectedRoute>
									<Layout>
										<PaymentPortal />
									</Layout>
								</ProtectedRoute>
							}
						/>
						<Route
							path="/payment/processing"
							element={
								<ProtectedRoute>
									<Layout>
										<PaymentProcessing />
									</Layout>
								</ProtectedRoute>
							}
						/>
					</Routes>
				</Router>
			</AdminProvider>
		</AuthProvider>
	);
}

export default App;
