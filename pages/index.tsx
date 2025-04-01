import React, { useState } from 'react';
import { GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { neon } from '@neondatabase/serverless';
import NavBar from './components/NavBar';
import { Medicine } from '../shared/schema';

interface HomePageProps {
  categories: string[];
  popularMedicines: Medicine[];
  totalMedicines: number;
}

export default function Home({ categories, popularMedicines, totalMedicines }: HomePageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Medicine[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(`/api/medicines/search/${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <>
      <Head>
        <title>Medicine Identifier App - Find Medication Information</title>
        <meta
          name="description"
          content="Search for medications, check interactions, and get detailed information about drugs."
        />
      </Head>

      <NavBar />

      <main>
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Find information about your medications
              </h1>
              <p className="text-xl mb-8">
                Search our database of {totalMedicines} medications, check for interactions, and set reminders
              </p>

              <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Search by medication name..."
                    className="w-full p-4 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <button
                  onClick={handleSearch}
                  disabled={isSearching || !searchQuery.trim()}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-4 rounded-lg font-medium flex items-center justify-center transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
                >
                  {isSearching ? (
                    <span>Searching...</span>
                  ) : (
                    <span>Search</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <section className="py-12 bg-gray-100">
            <div className="container mx-auto px-4">
              <h2 className="text-2xl font-bold mb-6">Search Results</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {searchResults.map((medicine) => (
                  <div
                    key={medicine.id}
                    className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                  >
                    <h3 className="text-xl font-semibold mb-2">{medicine.name}</h3>
                    <p className="text-gray-600 mb-3">{medicine.category}</p>
                    <p className="mb-4 text-sm">
                      {medicine.description?.substring(0, 120)}
                      {medicine.description && medicine.description.length > 120 ? '...' : ''}
                    </p>
                    <Link href={`/medicines/${medicine.id}`}>
                      <a className="text-blue-600 hover:text-blue-800 font-medium">
                        View Details
                      </a>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Popular Medicines */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold mb-6">Popular Medications</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {popularMedicines.map((medicine) => (
                <div
                  key={medicine.id}
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                >
                  <h3 className="text-xl font-semibold mb-2">{medicine.name}</h3>
                  <p className="text-gray-600 mb-3">{medicine.category}</p>
                  <p className="mb-4 text-sm">
                    {medicine.description?.substring(0, 120)}
                    {medicine.description && medicine.description.length > 120 ? '...' : ''}
                  </p>
                  <Link href={`/medicines/${medicine.id}`}>
                    <a className="text-blue-600 hover:text-blue-800 font-medium">
                      View Details
                    </a>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="py-12 bg-gray-100">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold mb-6">Browse by Category</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {categories.map((category, index) => (
                <Link key={index} href={`/categories/${encodeURIComponent(category)}`}>
                  <a className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow text-center">
                    {category}
                  </a>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold mb-8 text-center">Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <div className="text-blue-600 mb-4">
                  <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Detailed Information</h3>
                <p className="text-gray-600">
                  Access comprehensive information about medications, including uses, side effects, and dosage guidelines.
                </p>
              </div>
              
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <div className="text-blue-600 mb-4">
                  <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Interaction Checking</h3>
                <p className="text-gray-600">
                  Check for potential interactions between multiple medications to ensure your safety.
                </p>
              </div>
              
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <div className="text-blue-600 mb-4">
                  <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Medication Reminders</h3>
                <p className="text-gray-600">
                  Set up medication reminders to help you stay on track with your treatment schedule.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-gray-800 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Medicine Identifier App</h3>
              <p className="text-gray-400">
                Your trusted source for medication information and management tools.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/">
                    <a className="text-gray-400 hover:text-white">Home</a>
                  </Link>
                </li>
                <li>
                  <Link href="/interactions">
                    <a className="text-gray-400 hover:text-white">Interaction Checker</a>
                  </Link>
                </li>
                <li>
                  <Link href="/reminders">
                    <a className="text-gray-400 hover:text-white">Medication Reminders</a>
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Legal</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/privacy">
                    <a className="text-gray-400 hover:text-white">Privacy Policy</a>
                  </Link>
                </li>
                <li>
                  <Link href="/terms">
                    <a className="text-gray-400 hover:text-white">Terms of Service</a>
                  </Link>
                </li>
                <li>
                  <Link href="/disclaimer">
                    <a className="text-gray-400 hover:text-white">Medical Disclaimer</a>
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} Medicine Identifier App. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  try {
    const sql = neon(process.env.DATABASE_URL || "");
    
    // Get popular medicines
    const popularMedicinesQuery = `
      SELECT id, name, description, category 
      FROM medicines 
      ORDER BY name
      LIMIT 6
    `;
    
    // Get categories
    const categoriesQuery = `
      SELECT DISTINCT category FROM medicines ORDER BY category
    `;
    
    // Get total medicine count
    const totalCountQuery = `
      SELECT COUNT(*) as total FROM medicines
    `;
    
    const popularMedicines = await sql(popularMedicinesQuery);
    const categoriesResult = await sql(categoriesQuery);
    const totalCountResult = await sql(totalCountQuery);
    
    const categories = categoriesResult.map(row => row.category);
    const totalMedicines = totalCountResult[0]?.total || 0;
    
    return {
      props: {
        categories,
        popularMedicines,
        totalMedicines,
      },
      revalidate: 3600, // Revalidate every hour
    };
  } catch (error) {
    console.error("Error fetching data for home page:", error);
    
    // Return fallback data
    return {
      props: {
        categories: [],
        popularMedicines: [],
        totalMedicines: 0,
      },
      revalidate: 600, // Try again sooner if there was an error
    };
  }
};