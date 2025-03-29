import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-slate-800 text-white py-8 mt-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <span className="material-icons mr-2">medication</span>
              MediFind
            </h3>
            <p className="text-slate-300 text-sm">A comprehensive medication identifier tool to help you understand your medications and make informed healthcare decisions.</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-slate-300 text-sm">
              <li><Link href="/" className="hover:text-white transition">Home</Link></li>
              <li><Link href="/categories" className="hover:text-white transition">Medicine Categories</Link></li>
              <li><Link href="/interactions" className="hover:text-white transition">Medicine Interactions</Link></li>
              <li><Link href="/pharmacies" className="hover:text-white transition">Pharmacy Locator</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Important Information</h3>
            <p className="text-slate-300 text-sm mb-4">The information provided is for educational purposes only and is not intended as medical advice. Always consult with a healthcare professional.</p>
            <div className="flex space-x-4">
              <Link href="/terms" className="text-slate-300 hover:text-white transition">Terms</Link>
              <Link href="/privacy" className="text-slate-300 hover:text-white transition">Privacy</Link>
              <Link href="/contact" className="text-slate-300 hover:text-white transition">Contact</Link>
            </div>
          </div>
        </div>
        <div className="border-t border-slate-700 mt-8 pt-6 text-center text-slate-400 text-sm">
          <p>© {new Date().getFullYear()} MediFind. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
