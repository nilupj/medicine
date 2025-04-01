import React from "react";
import { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { neon } from "@neondatabase/serverless";
import NavBar from "../components/NavBar";
import { Medicine } from "../../shared/schema";

interface MedicineDetailPageProps {
  medicine: Medicine;
  relatedMedicines: Medicine[];
}

export default function MedicineDetailPage({ medicine, relatedMedicines }: MedicineDetailPageProps) {
  if (!medicine) {
    return (
      <>
        <Head>
          <title>Medicine Not Found | Medicine Information App</title>
        </Head>
        <NavBar />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-3xl font-bold mb-4">Medicine Not Found</h1>
          <p className="mb-8">The medicine you are looking for does not exist or has been removed.</p>
          <Link href="/">
            <a className="inline-block bg-primary text-white px-6 py-3 rounded-md">
              Return to Home
            </a>
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>{medicine.name} | Medicine Information</title>
        <meta
          name="description"
          content={`Learn about ${medicine.name}: uses, side effects, dosage, and more. Find comprehensive information about this medication.`}
        />
      </Head>
      
      <NavBar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Main content */}
          <div className="md:w-2/3">
            {/* Medicine Header */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold">{medicine.name}</h1>
                  <p className="text-gray-600 mt-1">{medicine.category}</p>
                </div>
                <div className="mt-4 md:mt-0">
                  <Link href={`/interactions?medicines=${medicine.id}`}>
                    <a className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md">
                      Check Interactions
                    </a>
                  </Link>
                </div>
              </div>
              
              {medicine.description && (
                <div className="mb-4">
                  <p className="text-gray-700">{medicine.description}</p>
                </div>
              )}
              
              {medicine.aliases && (
                <div className="mt-4">
                  <h2 className="text-sm font-semibold text-gray-500">Also Known As:</h2>
                  <p>{medicine.aliases}</p>
                </div>
              )}
            </div>
            
            {/* Medicine Details */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">Medication Details</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {medicine.composition && (
                  <div>
                    <h3 className="font-semibold text-gray-800">Composition</h3>
                    <p className="mt-1">{medicine.composition}</p>
                  </div>
                )}
                
                {medicine.uses && (
                  <div>
                    <h3 className="font-semibold text-gray-800">Uses</h3>
                    <p className="mt-1">{medicine.uses}</p>
                  </div>
                )}
                
                {medicine.dosage && (
                  <div>
                    <h3 className="font-semibold text-gray-800">Dosage</h3>
                    <p className="mt-1">{medicine.dosage}</p>
                  </div>
                )}
                
                {medicine.sideEffects && (
                  <div>
                    <h3 className="font-semibold text-gray-800">Side Effects</h3>
                    <p className="mt-1">{medicine.sideEffects}</p>
                  </div>
                )}
                
                {medicine.contraindications && (
                  <div>
                    <h3 className="font-semibold text-gray-800">Contraindications</h3>
                    <p className="mt-1">{medicine.contraindications}</p>
                  </div>
                )}
                
                {medicine.precautions && (
                  <div>
                    <h3 className="font-semibold text-gray-800">Precautions</h3>
                    <p className="mt-1">{medicine.precautions}</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Pricing Info */}
            {medicine.countNumber && medicine.l1Rate !== null && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-xl font-bold mb-4">Pricing Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <h3 className="font-semibold text-gray-800">Pack Size</h3>
                    <p className="mt-1">{medicine.countNumber} {medicine.formulation || 'units'}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">Price (L1 Rate)</h3>
                    <p className="mt-1">${medicine.l1Rate?.toFixed(2)}</p>
                  </div>
                  {medicine.l1Lab && (
                    <div>
                      <h3 className="font-semibold text-gray-800">Manufacturer</h3>
                      <p className="mt-1">{medicine.l1Lab}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Sidebar */}
          <div className="md:w-1/3">
            {/* Set Reminders */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">Medication Reminders</h2>
              <p className="mb-4">Never miss a dose again. Set up personalized reminders for this medication.</p>
              <Link href={`/reminders/new?medicineId=${medicine.id}`}>
                <a className="inline-block w-full bg-blue-600 text-white text-center px-4 py-2 rounded-md">
                  Set Up Reminders
                </a>
              </Link>
            </div>
            
            {/* Related Medicines */}
            {relatedMedicines.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold mb-4">Similar Medications</h2>
                <div className="space-y-3">
                  {relatedMedicines.map(related => (
                    <Link key={related.id} href={`/medicines/${related.id}`}>
                      <a className="block p-3 border border-gray-200 rounded-md hover:bg-gray-50">
                        <h3 className="font-medium">{related.name}</h3>
                        <p className="text-sm text-gray-600">{related.category}</p>
                      </a>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.params || {};
  
  if (!id || isNaN(Number(id))) {
    return {
      notFound: true,
    };
  }
  
  try {
    const sql = neon(process.env.DATABASE_URL || "");
    
    // Fetch medicine details
    const medicineQuery = `
      SELECT * FROM medicines 
      WHERE id = ${Number(id)}
      LIMIT 1
    `;
    
    const medicineResult = await sql(medicineQuery);
    
    if (!medicineResult || medicineResult.length === 0) {
      return {
        notFound: true,
      };
    }
    
    const medicine = medicineResult[0];
    
    // Fetch related medicines (same category)
    const relatedQuery = `
      SELECT id, name, category, description 
      FROM medicines 
      WHERE category = '${medicine.category}' 
      AND id != ${Number(id)}
      ORDER BY name
      LIMIT 5
    `;
    
    const relatedMedicines = await sql(relatedQuery);
    
    return {
      props: {
        medicine,
        relatedMedicines,
      },
    };
  } catch (error) {
    console.error("Error fetching medicine details:", error);
    
    return {
      notFound: true,
    };
  }
};