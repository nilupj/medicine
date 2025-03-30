import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Database, AlertCircle, CheckCircle } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface ImportResponse {
  message: string;
}

export default function Admin() {
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<'success' | 'error' | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const { toast } = useToast();

  const handleImportDrugs = async () => {
    if (isImporting) return;

    setIsImporting(true);
    setImportResult(null);
    setStatusMessage('');

    try {
      const response = await apiRequest<ImportResponse>('/api/admin/import-drugs', {
        method: 'POST'
      });

      setImportResult('success');
      setStatusMessage(response.message);
      toast({
        title: 'Import Started',
        description: 'Drug import process has been initiated.',
        variant: 'default',
      });
    } catch (error) {
      console.error('Error importing drugs:', error);
      setImportResult('error');
      setStatusMessage('Failed to start drug import process');
      toast({
        title: 'Import Failed',
        description: 'There was an error importing drugs.',
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="container max-w-4xl py-8">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="h-5 w-5 mr-2" />
            Drug Data Import
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <p className="mb-4">
            Import drug data from the prepared drug list file. This will add all drugs with their L1 rates and
            other information to the database.
          </p>
          
          {importResult === 'success' && (
            <Alert className="mb-4 bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertTitle>Import Process Started</AlertTitle>
              <AlertDescription>{statusMessage}</AlertDescription>
            </Alert>
          )}
          
          {importResult === 'error' && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Import Failed</AlertTitle>
              <AlertDescription>{statusMessage}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        
        <CardFooter>
          <Button onClick={handleImportDrugs} disabled={isImporting}>
            {isImporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isImporting ? 'Importing...' : 'Import Drug Data'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}