const Layout = ({ children, withPadding = true }) => {
	return (
		<div className="app-layout">
			<main
				className="main-content"
				style={{ padding: withPadding ? "20px" : "0" }}
			>
				{children}
			</main>
		</div>
	);
};

export default Layout;
