import { Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";
import Dashboard from "./pages/Dashboard";
import Overview from "./pages/Overview";
import Accounts from "./pages/Accounts";
import Campaigns from "./pages/Campaigns";
import Messages from "./pages/Messages";
import Tools from "./pages/Tools";
import SettingsPage from "./pages/Settings";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProtectedRoute from "./pages/ProtectedRoute";
import CRM from "./pages/CRM";
import ExtensionDownload from "./pages/Extension";
import Billing from "./pages/Billing";
import Index from "./pages/Index";
import CreateCampaign from "./pages/CreateCampaign";
import CampaignInfo from "./pages/CampaignInfo";
import CampaignEdit from "./pages/CampaignEdit";
import Inbox from "./pages/Inbox";
import Layout from "./components/Layout";
import PaymentPlans from "./pages/PaymentOptions";
import { AuthProvider } from "./contexts/AuthContext";
import { AdminProvider } from "./contexts/AdminContext";
import PaymentPortal from "./pages/PaymentPortal";

function App() {
	return (
		<ThemeProvider>
			<AuthProvider>
				<AdminProvider>
					<Routes>
						<Route path="/" element={<Index />} />
						<Route path="/dashboard" element={<Dashboard />}>
							<Route index element={<Overview />} />
							<Route path="accounts" element={<Accounts />} />
							<Route path="campaigns" element={<Campaigns />} />
							<Route path="messages" element={<Messages />} />
							<Route path="tools" element={<Tools />} />
							<Route path="settings" element={<SettingsPage />} />
							<Route path="crm" element={<CRM />} />
							<Route path="extension" element={<ExtensionDownload />} />
							<Route path="create-campaign" element={<CreateCampaign />} />
							<Route path="payment-plans" element={<PaymentPlans />} />
							<Route
								path="campaign-info/:campaignId"
								element={<CampaignInfo />}
							/>
							<Route
								path="campaign-edit/:campaignId"
								element={<CampaignEdit />}
							/>
						</Route>
						<Route
							path="/dashboard/inbox"
							element={
								<Layout withPadding={false}>
									<Inbox />
								</Layout>
							}
						/>
						<Route path="/login" element={<Login />} />
						<Route path="/register" element={<Register />} />
						<Route
							path="/payment-portal"
							element={
								<ProtectedRoute>
									<PaymentPortal />
								</ProtectedRoute>
							}
						/>
						<Route
							path="/billing"
							element={
								<ProtectedRoute>
									<Billing />
								</ProtectedRoute>
							}
						/>
					</Routes>
				</AdminProvider>
			</AuthProvider>
		</ThemeProvider>
	);
}

export default App;
