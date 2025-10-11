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
import ContactMe from "./pages/Contact";
import SubscriptionPage from "./pages/SubscriptionPage";
import CancelPage from "./pages/CancelPage";
import SuccessPage from "./pages/SuccessPage";
import ManageSubscription from "./pages/ManageSubscription";
import NotFound from "./pages/NotFound";
import { AlertProvider } from "./contexts/AlertContext";
import AlertContainer from "./components/AlertContainer";
import { ConfirmProvider } from "./contexts/ConfirmContext";
import ConfirmContainer from "./components/ConfirmContainer";
import { AuthProvider } from "./contexts/AuthContext";
import { AdminProvider } from "./contexts/AdminContext";
import PaymentPortal from "./pages/PaymentPortal";

function App() {
	return (
		<ThemeProvider>
			<AuthProvider>
				<AdminProvider>
					<AlertProvider>
						<ConfirmProvider>
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
										path="manage-subscription"
										element={<ManageSubscription />}
									/>
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
								<Route
									path="/dashboard/contact"
									element={
										<Layout withPadding={false}>
											<ContactMe />
										</Layout>
									}
								/>
								<Route path="/login" element={<Login />} />
								<Route path="/register" element={<Register />} />
								<Route
									path="/subscription"
									element={
										<ProtectedRoute>
											<SubscriptionPage />
										</ProtectedRoute>
									}
								/>
								<Route
									path="/cancel"
									element={
										<ProtectedRoute>
											<CancelPage />
										</ProtectedRoute>
									}
								/>
								<Route
									path="/success"
									element={
										<ProtectedRoute>
											<SuccessPage />
										</ProtectedRoute>
									}
								/>
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
								<Route path="/contact" element={<ContactMe />} />
								<Route path="*" element={<NotFound />} />
							</Routes>
							<AlertContainer />
							<ConfirmContainer />
						</ConfirmProvider>
					</AlertProvider>
				</AdminProvider>
			</AuthProvider>
		</ThemeProvider>
	);
}

export default App;
