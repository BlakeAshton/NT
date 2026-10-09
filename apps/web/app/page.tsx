
export default function Home() {
  return (
    <section className="hero">
      <span className="eyebrow">
        NT • DISCORD SECURITY & MANAGEMENT
      </span>

      <h1>
        Meet <em>NT.</em>
        <br />
        Your server.
        <br />
        <em>Protected.</em>
      </h1>

      <p>
        Powerful moderation, intelligent raid detection,
        security monitoring and server management —
        all in one clean, powerful platform.
      </p>

      <a className="button" href="/api/auth/login">
        Login with Discord →
      </a>

      <div className="nt-features">
        <div className="nt-feature">
          <span>🛡️</span>
          <strong>Security Monitoring</strong>
          <small>Stay informed about suspicious activity.</small>
        </div>

        <div className="nt-feature">
          <span>⚡</span>
          <strong>Moderation Tools</strong>
          <small>Manage your community with confidence.</small>
        </div>

        <div className="nt-feature">
          <span>📡</span>
          <strong>Real-Time Alerts</strong>
          <small>Receive notifications when threats are detected.</small>
        </div>
      </div>
    </section>
  );
}
