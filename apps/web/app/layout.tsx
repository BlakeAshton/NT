
import type { ReactNode } from 'react';
import './style.css';

export const metadata = {
  title: 'NT | Dashboard',
  description: 'NT | Discord Security & Management',
  icons: {
    icon: '/nt-logo.jpg',
    apple: '/nt-logo.jpg'
  }
};

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header>
          <a href="/" className="nt-brand">
            <img
              src="/nt-logo.jpg"
              alt="NT"
              className="nt-logo"
            />
            <span>NT</span>
          </a>

          <nav>
            <a href="/dashboard">Dashboard</a>
          </nav>
        </header>

        <main>{children}</main>
      </body>
    </html>
  );
}
