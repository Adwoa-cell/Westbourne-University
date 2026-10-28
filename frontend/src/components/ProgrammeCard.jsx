export default function ProgrammeCard({ programme }) {
  return (
    <article className="card programme-card">
      <h3>{programme.name}</h3>
      <p className="meta">{programme.code} &middot; {programme.duration} &middot; {programme.studyMode}</p>
      <p>{programme.description}</p>
      <p className="entry"><strong>Entry requirements:</strong> {programme.entryRequirements}</p>
    </article>
  );
}
