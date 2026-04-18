import { createApp } from "./server.js";

async function start() {
    try {
        const PORT = parseInt(process.env.PORT || "3000", 10);
        const HOST = process.env.HOST || "0.0.0.0";
        const NODE_ENV = process.env.NODE_ENV || "development";

        const app = await createApp();

        await app.listen({ port: PORT, host: HOST });

        if (NODE_ENV === "development") {
            const addressInfo = app.server.address();

            let url: string;

            if (typeof addressInfo === "string") {
                url = addressInfo;
            } else {
                const host = addressInfo?.address ?? "localhost";
                const port = addressInfo?.port ?? PORT;
                url = "http://" + host + ":" + port;
            }
        }
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

start();

export { start };
