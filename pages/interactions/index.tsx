import React, { useState, useEffect } from "react";
import Head from "next/head";
import { GetStaticProps } from "next";
import { neon } from "@neondatabase/serverless";
import NavBar from "../components/NavBar";
import { Medicine, DrugInteraction } from "../../shared/schema";

interface InteractionsPageProps {
  medicines: Medicine[];
}

export default function InteractionsPage({ medicines }: InteractionsPageProps) {
  const [selectedMedicines, setSelectedMedicines] = useState<Medicine[]>([]);
  const [interactions, setInteractions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [webSocket, setWebSocket] = useState<WebSocket | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize WebSocket connection
  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("WebSocket connection established");
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === "interactions_result") {
          setInteractions(data.interactions);
          setIsLoading(false);
        } else if (data.type === "error") {
          setError(data.message);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
        setError("Error processing interaction check");
        setIsLoading(false);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      setError("WebSocket connection error");
      setIsLoading(false);
    };

    ws.onclose = () => {
      console.log("WebSocket connection closed");
    };

    setWebSocket(ws);

    // Clean up the WebSocket connection when component unmounts
    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, []);

  const toggleMedicineSelection = (medicine: Medicine) => {
    if (selectedMedicines.some(med => med.id === medicine.id)) {
      setSelectedMedicines(selectedMedicines.filter(med => med.id !== medicine.id));
    } else {
      if (selectedMedicines.length < 5) {
        setSelectedMedicines([...selectedMedicines, medicine]);
      } else {
        setError("You can select up to 5 medicines");
      }
    }
  };

  const checkInteractions = () => {
    if (selectedMedicines.length < 2) {
      setError("Please select at least 2 medicines to check for interactions");
      return;
    }

    if (webSocket && webSocket.readyState === WebSocket.OPEN) {
      setIsLoading(true);
      setError(null);
      setInteractions([]);
      
      webSocket.send(JSON.stringify({
        type: 'check_interactions',
        medicineIds: selectedMedicines.map(med => med.id)
      }));
    } else {
      setError("WebSocket connection not available");
    }
  };

  return (
    <>
      <Head>
        <title>Check Drug Interactions | Medicine Identifier</title>
        <meta
          name="description"
          content="Check for potential interactions between multiple medications. Our real-time drug interaction checker helps you identify possible risks."
        />
      </Head>

      <NavBar />

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Drug Interaction Checker</h1>
        
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-4">Select Medicines to Check (Up to 5)</h2>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {selectedMedicines.map(med => (
              <div 
                key={med.id} 
                className="bg-blue-100 border border-blue-300 rounded-md p-3 flex justify-between items-center"
              >
                <span className="font-medium">{med.name}</span>
                <button 
                  onClick={() => toggleMedicineSelection(med)}
                  className="text-blue-700 hover:text-blue-900"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          
          <button
            onClick={checkInteractions}
            disabled={selectedMedicines.length < 2 || isLoading}
            className={`px-4 py-2 rounded-md font-medium ${
              selectedMedicines.length < 2 || isLoading
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            {isLoading ? "Checking..." : "Check Interactions"}
          </button>
        </div>
        
        {/* Interactions Results */}
        {interactions.length > 0 ? (
          <div className="bg-white p-6 rounded-lg shadow-md mb-8">
            <h2 className="text-xl font-semibold mb-4">Interaction Results</h2>
            
            {interactions.length > 0 ? (
              <div className="space-y-4">
                {interactions.map((interaction, index) => (
                  <div 
                    key={index} 
                    className={`p-4 rounded-md ${
                      interaction.severity === 'High' 
                        ? 'bg-red-100 border border-red-300' 
                        : interaction.severity === 'Medium'
                          ? 'bg-yellow-100 border border-yellow-300'
                          : 'bg-blue-100 border border-blue-300'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-lg">
                          {interaction.medicine1?.name} + {interaction.medicine2?.name}
                        </h3>
                        <p className="text-sm font-medium mt-1">
                          <span className={`px-2 py-1 rounded ${
                            interaction.severity === 'High' 
                              ? 'bg-red-200 text-red-800' 
                              : interaction.severity === 'Medium'
                                ? 'bg-yellow-200 text-yellow-800'
                                : 'bg-blue-200 text-blue-800'
                          }`}>
                            {interaction.severity} Severity
                          </span>
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <p className="font-medium mb-1">Effects:</p>
                      <p>{interaction.effect}</p>
                    </div>
                    
                    {interaction.recommendation && (
                      <div className="mt-2">
                        <p className="font-medium mb-1">Recommendation:</p>
                        <p>{interaction.recommendation}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p>No interactions found between the selected medicines.</p>
            )}
          </div>
        ) : null}
        
        {/* Medicine Selection */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Available Medicines</h2>
          
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search medicines..."
              className="w-full p-2 border border-gray-300 rounded-md"
              // Add search functionality if needed
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {medicines.map(medicine => (
              <div 
                key={medicine.id}
                onClick={() => toggleMedicineSelection(medicine)}
                className={`p-4 border rounded-md cursor-pointer transition-colors ${
                  selectedMedicines.some(med => med.id === medicine.id)
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-300 hover:bg-gray-50"
                }`}
              >
                <h3 className="font-medium">{medicine.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{medicine.category}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  try {
    const sql = neon(process.env.DATABASE_URL || "");
    
    const medicinesQuery = `
      SELECT id, name, description, category FROM medicines 
      ORDER BY name LIMIT 50
    `;
    
    const medicines = await sql(medicinesQuery);
    
    return {
      props: {
        medicines,
      },
      revalidate: 3600, // Revalidate every hour
    };
  } catch (error) {
    console.error("Error fetching medicines for interaction page:", error);
    
    return {
      props: {
        medicines: [],
      },
      revalidate: 600, // Try again sooner if there was an error
    };
  }
};