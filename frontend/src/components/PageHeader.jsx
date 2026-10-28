export default function PageHeader({ title, intro }) {
  return (
    <section className="page-header">
      <div className="container">
        <h1>{title}</h1>
        {intro && <p className="lead">{intro}</p>}
      </div>
    </section>
  );
}
