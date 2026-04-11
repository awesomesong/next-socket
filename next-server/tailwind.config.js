const { heroui } = require("@heroui/react");

module.exports = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./src/**/*.{js,ts,jsx,tsx}",
        "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontSize: {
                xs: ['0.8125rem', { lineHeight: '1.125rem' }],
            },
            screens: {
                'xs': '320px', // min-width
            },
            colors: {
                lavender: {
                    DEFAULT: 'var(--color-lavender)',
                    light: 'var(--color-lavender-light)',
                    muted: 'var(--color-lavender-muted)',
                    pale: 'var(--color-lavender-pale)',
                    border: 'var(--color-lavender-border)',
                },
                ivory: 'var(--color-ivory)',
                text: {
                    primary: 'var(--color-text-primary)',
                    secondary: 'var(--color-text-secondary)',
                }
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