export default function Forbidden403() {
  return (
    <div className="p-8 text-center">
      <h1 className="text-3xl font-semibold mb-2">403 — No Access</h1>
      <p className="opacity-80">
        You’re signed in, but your role/plan lacks permission for this area.
      </p>
      <a href="/app" className="inline-block mt-6 underline">
        Go to Dashboard
      </a>
    </div>
  );
}
