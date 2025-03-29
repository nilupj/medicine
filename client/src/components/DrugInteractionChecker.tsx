import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Loader2, AlertTriangle, AlertCircle, Check, X } from 'lucide-react';
import type { Medicine } from '@shared/schema';
import type { DrugInteractionDetail } from '@/lib/utils';

// Interface for the drug interaction props
interface DrugInteractionCheckerProps {
  selectedMedicines: Medicine[];
  onClose: () => void;
}

// WebSocket message types
type WebSocketMessage = {
  type: string;
  [key: string]: any;
};

export default function DrugInteractionChecker({ 
  selectedMedicines, 
  onClose 
}: DrugInteractionCheckerProps) {
  const [isConnecting, setIsConnecting] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [interactions, setInteractions] = useState<DrugInteractionDetail[]>([]);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Create a WebSocket connection when the component mounts
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      console.log('WebSocket connection established');
      setIsConnecting(false);
      
      // Automatically check for interactions if there are selected medicines
      if (selectedMedicines.length >= 2) {
        handleCheckInteractions();
      }
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as WebSocketMessage;
        
        if (data.type === 'interactions_result') {
          setInteractions(data.interactions || []);
          setIsChecking(false);
        } else if (data.type === 'error') {
          setError(data.message || 'An error occurred');
          setIsChecking(false);
        }
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
        setError('Failed to process server response');
        setIsChecking(false);
      }
    };

    socket.onerror = (event) => {
      console.error('WebSocket error:', event);
      setError('Connection error. Please try again.');
      setIsConnecting(false);
      setIsChecking(false);
    };

    socket.onclose = () => {
      console.log('WebSocket connection closed');
    };

    // Clean up the WebSocket connection when the component unmounts
    return () => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, []);

  const handleCheckInteractions = () => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      setError('WebSocket connection not available');
      return;
    }

    if (selectedMedicines.length < 2) {
      setError('Please select at least two medicines to check for interactions');
      return;
    }

    setIsChecking(true);
    setError(null);
    setInteractions([]);

    const medicineIds = selectedMedicines.map(med => med.id);
    
    socketRef.current.send(JSON.stringify({
      type: 'check_interactions',
      medicineIds
    }));
  };

  function getSeverityColor(severity: string): string {
    switch (severity.toLowerCase()) {
      case 'minor':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100';
      case 'moderate':
        return 'bg-orange-100 text-orange-800 hover:bg-orange-100';
      case 'major':
        return 'bg-red-100 text-red-800 hover:bg-red-100';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
    }
  }

  function getSeverityIcon(severity: string) {
    switch (severity.toLowerCase()) {
      case 'minor':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'moderate':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'major':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  }

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Drug Interaction Checker</CardTitle>
        <CardDescription>
          Check for potential interactions between your selected medications
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {isConnecting ? (
          <div className="flex items-center justify-center p-6">
            <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
            <span>Connecting to interaction service...</span>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <h3 className="text-lg font-medium mb-2">Selected Medicines</h3>
              <div className="flex flex-wrap gap-2">
                {selectedMedicines.map(medicine => (
                  <Badge key={medicine.id} className="py-1 px-3">
                    {medicine.name}
                  </Badge>
                ))}
              </div>
            </div>
            
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {isChecking ? (
              <div className="flex items-center justify-center p-6">
                <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
                <span>Checking for interactions...</span>
              </div>
            ) : interactions.length > 0 ? (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Interaction Results</h3>
                {interactions.map((interaction, index) => (
                  <div key={interaction.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-md font-semibold">
                        {interaction.medicine1.name} + {interaction.medicine2.name}
                      </h4>
                      <Badge className={getSeverityColor(interaction.severity)}>
                        {getSeverityIcon(interaction.severity)}
                        <span className="ml-1">{interaction.severity}</span>
                      </Badge>
                    </div>
                    <p className="mb-2 text-sm">{interaction.description}</p>
                    
                    <Separator className="my-2" />
                    
                    <div className="mt-2">
                      <h5 className="text-sm font-medium mb-1">Effects</h5>
                      <p className="text-sm text-gray-700">{interaction.effects}</p>
                    </div>
                    
                    {interaction.management && (
                      <div className="mt-2">
                        <h5 className="text-sm font-medium mb-1">Management</h5>
                        <p className="text-sm text-gray-700">{interaction.management}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : selectedMedicines.length >= 2 ? (
              <div className="flex flex-col items-center justify-center p-6 text-center">
                <Check className="h-12 w-12 text-green-500 mb-2" />
                <h3 className="text-lg font-medium">No interactions found</h3>
                <p className="text-gray-500">
                  No known interactions were found between the selected medications.
                </p>
              </div>
            ) : null}
          </>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onClose}>
          <X className="h-4 w-4 mr-2" />
          Close
        </Button>
        <Button 
          onClick={handleCheckInteractions} 
          disabled={isConnecting || isChecking || selectedMedicines.length < 2}
        >
          {isChecking && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          Check Interactions
        </Button>
      </CardFooter>
    </Card>
  );
}