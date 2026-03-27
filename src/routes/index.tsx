import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({ component: App });

function App() {
  return (
    <div className="page-wrap px-4 pb-8 pt-14">
      <section>
        <h1 className="mb-5">Root page</h1>
      </section>
    </div>
  );
}
