import { Link } from "wouter";

export default function Header() {
  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center">
          <span className="material-icons text-primary text-3xl mr-2">medication</span>
          <h1 className="text-xl md:text-2xl font-semibold text-primary">MediFind</h1>
        </div>
        <nav>
          <ul className="flex space-x-4">
            <li><Link href="/" className="text-slate-600 hover:text-primary transition">Home</Link></li>
            <li><Link href="/categories" className="text-slate-600 hover:text-primary transition">Categories</Link></li>
            <li><Link href="/about" className="text-slate-600 hover:text-primary transition">About</Link></li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
