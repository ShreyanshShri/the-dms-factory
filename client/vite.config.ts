import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
	plugins: [react()],
	server: {
		port: 3000,
		open: true,
		// allowedHosts: ["6ff9140531a7.ngrok-free.app"],
	},
});
