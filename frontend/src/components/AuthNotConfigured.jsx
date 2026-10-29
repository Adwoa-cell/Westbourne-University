export default function AuthNotConfigured() {
  return (
    <div className="notice" role="status">
      <h2>Sign-in is not set up yet</h2>
      <p>This copy of the website is not connected to a Supabase project, so accounts cannot be created or used.</p>
      <p>To enable it:</p>
      <ol>
        <li>Create a Supabase project and run the database migrations (see <code>docs/supabase-setup.md</code>).</li>
        <li>Copy <code>frontend/.env.example</code> to <code>frontend/.env</code> and fill in <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code>.</li>
        <li>Restart <code>npm run dev</code>.</li>
      </ol>
    </div>
  );
}
