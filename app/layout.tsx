import "./globals.css";

export const metadata = {
    title: "Serendipity-SRM",
    description: "Find people to do things with.",
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
