import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useSession, signOut } from "next-auth/react";

export default function NavBar() {
  const router = useRouter();
  const { data: session } = useSession();
  
  const isActive = (path: string) => {
    if (path === '/') {
      return router.pathname === path;
    }
    return router.pathname.startsWith(path);
  };
  
  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <a className="flex items-center">
                <span className="text-2xl font-bold text-blue-600">MedInfo</span>
                <span className="ml-2 text-gray-600">App</span>
              </a>
            </Link>
            <button className="md:hidden p-2 rounded focus:outline-none focus:ring" aria-label="Toggle menu">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
          
          <nav className="md:flex items-center mt-4 md:mt-0">
            <ul className="flex flex-col md:flex-row md:space-x-6">
              <li>
                <Link href="/">
                  <a className={`block py-2 hover:text-blue-600 ${isActive('/') ? 'text-blue-600 font-medium' : 'text-gray-700'}`}>
                    Home
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/interactions">
                  <a className={`block py-2 hover:text-blue-600 ${isActive('/interactions') ? 'text-blue-600 font-medium' : 'text-gray-700'}`}>
                    Interactions
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/reminders">
                  <a className={`block py-2 hover:text-blue-600 ${isActive('/reminders') ? 'text-blue-600 font-medium' : 'text-gray-700'}`}>
                    Reminders
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/categories">
                  <a className={`block py-2 hover:text-blue-600 ${isActive('/categories') ? 'text-blue-600 font-medium' : 'text-gray-700'}`}>
                    Categories
                  </a>
                </Link>
              </li>
            </ul>
            
            <div className="mt-4 md:mt-0 md:ml-6">
              {session ? (
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-700">
                    {session.user?.name || session.user?.email}
                  </span>
                  <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Sign out
                  </button>
                </div>
              ) : (
                <Link href="/login">
                  <a className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    Sign in
                  </a>
                </Link>
              )}
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}