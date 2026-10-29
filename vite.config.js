import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
// https://vitejs.dev/config/
export default defineConfig(function (_a) {
    var mode = _a.mode;
    console.log(mode);
    return {
        plugins: [
            react({
                jsxImportSource: "react",
            }),
        ],
        resolve: {
            alias: {
                "@": "/src",
            },
        },
    };
});
