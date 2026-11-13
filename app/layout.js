import './globals.css';

export const metadata = {
  title: 'TaskEarn — Watch ads, earn rewards',
  description: 'Complete simple tasks and earn rewards.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
