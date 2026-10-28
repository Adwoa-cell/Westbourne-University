// Renders loading and error states, then calls children(data) once data has arrived.
export default function DataState({ state, children }) {
  if (state.loading && !state.data) return <p className="status" role="status">Loading...</p>;
  if (state.error) return <p className="status status-error" role="alert">{state.error.message}</p>;
  if (!state.data) return null;
  return children(state.data);
}
