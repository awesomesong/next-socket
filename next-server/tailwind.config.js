const {heroui} = require("@heroui/react");

module.exports = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./src/**/*.{js,ts,jsx,tsx}",
        "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            screens: {
                'xs': '320px', // min-width
            },
            height: {
                'screen-dynamic': 'calc(var(--vh, 1vh) * 100)',
            }
        },
        container: {
            center: true,
            padding: '1rem',  
        },
    },
    plugins: [
        heroui(),
    ],
    darkMode: 'class',
};