import { build } from "vite";

async function runBuild() {
	try {
		console.log("Starting Vite build...");
		await build({
			logLevel: "info",
			configFile: "./vite.config.ts",
		});
		console.log("Build completed successfully");
	} catch (error: unknown) {
		console.error("=== BUILD ERROR ===");
		console.error("Error type:", typeof error);
		console.error("Error constructor:", error?.constructor?.name);
		if (error instanceof Error) {
			console.error("Message:", error.message);
			console.error("Stack:", error.stack);
			if ("code" in error) console.error("Code:", (error as { code: unknown }).code);
			if ("plugin" in error) console.error("Plugin:", (error as { plugin: unknown }).plugin);
			if ("id" in error) console.error("ID:", (error as { id: unknown }).id);
			if ("loc" in error) console.error("Location:", JSON.stringify((error as { loc: unknown }).loc));
			if ("frame" in error) console.error("Frame:", (error as { frame: unknown }).frame);
		} else {
			console.error("Raw error:", JSON.stringify(error, null, 2));
			console.error("String repr:", String(error));
		}
		console.error("===================");
		process.exit(1);
	}
}

runBuild();
