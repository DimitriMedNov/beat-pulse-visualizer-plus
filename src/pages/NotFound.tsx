import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">Esta página no existe.</p>
        <Link to="/" className="text-primary underline underline-offset-4 hover:opacity-80">
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
