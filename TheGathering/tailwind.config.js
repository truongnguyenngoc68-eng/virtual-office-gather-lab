/** @type {import('tailwindcss').Config} */
module.exports = {
    // Chế độ selector: Dựa vào class 'dark' trên thẻ html
    darkMode: 'selector',

    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {},
    },
    plugins: [],
}
