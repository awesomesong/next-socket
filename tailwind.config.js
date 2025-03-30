const {nextui} = require("@nextui-org/react");

module.exports = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./src/**/*.{js,ts,jsx,tsx}",
        "./node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            screens: {
                'xs': '320px', // min-width
            },
        },
        container: {
            center: true,
            padding: '1rem',  
        },
    },
    plugins: [
        nextui(),
    ],
    darkMode: 'class',
};