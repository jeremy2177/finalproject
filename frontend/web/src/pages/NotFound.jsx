import React from 'react';
import { Link } from 'react-router-dom';

function NotFound() {
  return (
    <main className="main-content">
      <div className="not-found-page">
        <h1>404</h1>
        <h2>Page Not Found</h2>
        <p className="text-muted">The page you are looking for does not exist or has been moved.</p>
        <Link to="/" className="btn btn--primary">
          Return to Dashboard
        </Link>
      </div>
    </main>
  );
}

export default NotFound;
