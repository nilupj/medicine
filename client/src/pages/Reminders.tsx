import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getCurrentUser } from '@/lib/auth';
import { 
  getMedicationSchedules,
  getScheduleFrequency,
  getReminderTimes,
  formatFrequencyType,
  formatDaysOfWeek,
  formatTimeString,
  deleteMedicationSchedule,
  logMedication
} from '@/lib/reminders';
import { queryClient } from '@/lib/queryClient';
import { Medicine, MedicationSchedule } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Plus, 
  Calendar, 
  Clock, 
  Pill, 
  Trash2, 
  CheckCircle,
  XCircle, 
  Edit,
  AlertCircle
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function RemindersPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedSchedule, setSelectedSchedule] = useState<MedicationSchedule | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // Fetch current user
  const { data: user, isLoading: isLoadingUser } = useQuery({
    queryKey: ['/api/auth/me'],
    queryFn: getCurrentUser,
    retry: false
  });
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoadingUser && !user) {
      toast({
        title: "Authentication required",
        description: "Please login to access your medication reminders",
        variant: "destructive",
      });
      setLocation('/login');
    }
  }, [user, isLoadingUser, setLocation, toast]);
  
  // Fetch medication schedules
  const { data: schedules = [], isLoading: isLoadingSchedules } = useQuery({
    queryKey: ['/api/schedules'],
    queryFn: getMedicationSchedules,
    enabled: !!user
  });
  
  // Delete medication schedule mutation
  const deleteMutation = useMutation({
    mutationFn: deleteMedicationSchedule,
    onSuccess: () => {
      toast({
        title: "Schedule deleted",
        description: "The medication schedule has been deleted successfully",
      });
      setIsDeleteDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/schedules'] });
    },
    onError: (error) => {
      console.error('Error deleting schedule:', error);
      toast({
        title: "Delete failed",
        description: "There was an error deleting the medication schedule",
        variant: "destructive",
      });
    }
  });
  
  // Log medication taken mutation
  const logMedicationMutation = useMutation({
    mutationFn: ({ scheduleId, data }: { scheduleId: number; data: any }) => 
      logMedication(scheduleId, data),
    onSuccess: () => {
      toast({
        title: "Medication logged",
        description: "You've successfully recorded taking this medication",
      });
    },
    onError: (error) => {
      console.error('Error logging medication:', error);
      toast({
        title: "Log failed",
        description: "There was an error recording this medication",
        variant: "destructive",
      });
    }
  });
  
  // Handle delete confirmation
  const handleDeleteConfirm = () => {
    if (selectedSchedule) {
      deleteMutation.mutate(selectedSchedule.id);
    }
  };
  
  // Handle medication taken
  const handleMedicationTaken = (scheduleId: number) => {
    logMedicationMutation.mutate({
      scheduleId,
      data: { status: 'taken', notes: '' }
    });
  };
  
  // Handle medication skipped
  const handleMedicationSkipped = (scheduleId: number) => {
    logMedicationMutation.mutate({
      scheduleId,
      data: { status: 'skipped', notes: 'User skipped this dose' }
    });
  };
  
  // Loading state
  if (isLoadingUser) {
    return (
      <div className="container mx-auto py-10 flex items-center justify-center">
        <p>Loading user information...</p>
      </div>
    );
  }
  
  // Not authenticated
  if (!user) {
    return null; // Will redirect via useEffect
  }
  
  return (
    <div className="container mx-auto py-10 max-w-6xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Your Medication Reminders</h1>
          <p className="text-muted-foreground">
            Track and manage your medication schedules
          </p>
        </div>
        
        <Button onClick={() => setLocation('/reminders/new')}>
          <Plus className="mr-2 h-4 w-4" /> Add Medication
        </Button>
      </div>
      
      <Tabs defaultValue="active" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="active">Active Medications</TabsTrigger>
          <TabsTrigger value="history">Medication History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="active">
          {isLoadingSchedules ? (
            <p>Loading your medication schedules...</p>
          ) : schedules.length === 0 ? (
            <div className="text-center py-12">
              <Pill className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No medication schedules</h3>
              <p className="text-muted-foreground mt-2 mb-6">
                You don't have any medication schedules set up yet.
              </p>
              <Button onClick={() => setLocation('/reminders/new')}>
                <Plus className="mr-2 h-4 w-4" /> Add Your First Medication
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {schedules.map((schedule) => (
                <ScheduleCard 
                  key={schedule.id} 
                  schedule={schedule}
                  onDelete={(schedule) => {
                    setSelectedSchedule(schedule);
                    setIsDeleteDialogOpen(true);
                  }}
                  onTaken={(scheduleId) => handleMedicationTaken(scheduleId)}
                  onSkipped={(scheduleId) => handleMedicationSkipped(scheduleId)}
                  onEdit={(scheduleId) => setLocation(`/reminders/edit/${scheduleId}`)}
                />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="history">
          <MedicationHistoryTab />
        </TabsContent>
      </Tabs>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this medication schedule and all associated
              reminder times and logs. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ScheduleCard({ 
  schedule, 
  onDelete, 
  onTaken, 
  onSkipped, 
  onEdit 
}: { 
  schedule: MedicationSchedule; 
  onDelete: (schedule: MedicationSchedule) => void;
  onTaken: (scheduleId: number) => void;
  onSkipped: (scheduleId: number) => void;
  onEdit: (scheduleId: number) => void;
}) {
  // Fetch medication details
  const { data: medicine } = useQuery({
    queryKey: ['/api/medicines', schedule.medicineId],
    queryFn: async () => {
      const response = await fetch(`/api/medicines/${schedule.medicineId}`);
      if (!response.ok) throw new Error('Failed to fetch medicine');
      return response.json() as Promise<Medicine>;
    }
  });
  
  // Fetch frequency details
  const { data: frequency } = useQuery({
    queryKey: ['/api/schedules', schedule.id, 'frequency'],
    queryFn: () => getScheduleFrequency(schedule.id)
  });
  
  // Fetch reminder times
  const { data: reminders = [] } = useQuery({
    queryKey: ['/api/schedules', schedule.id, 'reminders'],
    queryFn: () => getReminderTimes(schedule.id)
  });
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle>{medicine?.name || 'Loading...'}</CardTitle>
          <div className="flex space-x-1">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => onEdit(schedule.id)}
              title="Edit schedule"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => onDelete(schedule)}
              className="text-destructive"
              title="Delete schedule"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <CardDescription>
          {schedule.dosage} {schedule.dosageUnit}
          {schedule.instructions && ` - ${schedule.instructions}`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {frequency && (
            <div className="flex items-center text-sm">
              <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>
                <span className="font-medium">{formatFrequencyType(frequency.frequencyType)}</span>
                {frequency.frequencyType === 'weekly' && frequency.daysOfWeek && (
                  <span> on {formatDaysOfWeek(frequency.daysOfWeek)}</span>
                )}
                {frequency.frequencyType === 'monthly' && frequency.dayOfMonth && (
                  <span> on day {frequency.dayOfMonth}</span>
                )}
              </span>
            </div>
          )}
          
          {reminders.length > 0 && (
            <div className="flex items-center text-sm">
              <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>
                {reminders.map((reminder, i) => (
                  <span key={reminder.id}>
                    {i > 0 && ', '}
                    {formatTimeString(reminder.time)}
                  </span>
                ))}
              </span>
            </div>
          )}
          
          {schedule.startDate && (
            <div className="flex items-center text-sm">
              <AlertCircle className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>
                Started on {new Date(schedule.startDate).toLocaleDateString()}
                {schedule.endDate && ` until ${new Date(schedule.endDate).toLocaleDateString()}`}
              </span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-2 flex justify-between">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">View Details</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{medicine?.name}</DialogTitle>
              <DialogDescription>
                {medicine?.description}
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4 space-y-4">
              {medicine?.category && (
                <div>
                  <h4 className="font-medium mb-1">Categories</h4>
                  <div className="flex flex-wrap gap-2">
                    {medicine.category.split(',').map((cat, i) => (
                      <Badge key={i} variant="outline">{cat.trim()}</Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {medicine?.uses && (
                <div>
                  <h4 className="font-medium mb-1">Uses</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    {medicine.uses.split('\n').map((use, i) => (
                      <li key={i}>{use}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {medicine?.sideEffects && (
                <div>
                  <h4 className="font-medium mb-1">Side Effects</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    {medicine.sideEffects.split('\n').map((effect, i) => (
                      <li key={i}>{effect}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {medicine?.interactions && (
                <div>
                  <h4 className="font-medium mb-1">Drug Interactions</h4>
                  <p className="text-sm">{medicine.interactions}</p>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => onSkipped(schedule.id)}>Skip Dose</Button>
              <Button onClick={() => onTaken(schedule.id)}>Mark as Taken</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="text-destructive"
            onClick={() => onSkipped(schedule.id)}
          >
            <XCircle className="mr-1 h-4 w-4" /> Skip
          </Button>
          <Button 
            size="sm"
            onClick={() => onTaken(schedule.id)}
          >
            <CheckCircle className="mr-1 h-4 w-4" /> Taken
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

function MedicationHistoryTab() {
  // Fetch medication logs
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['/api/logs'],
    queryFn: async () => {
      const response = await fetch('/api/logs');
      if (!response.ok) throw new Error('Failed to fetch logs');
      return response.json();
    }
  });
  
  // Group logs by date
  const groupedLogs = logs.reduce((acc: any, log: any) => {
    const date = new Date(log.takenAt).toLocaleDateString();
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(log);
    return acc;
  }, {});
  
  // Sort dates in descending order
  const sortedDates = Object.keys(groupedLogs).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );
  
  if (isLoading) {
    return <p>Loading medication history...</p>;
  }
  
  if (logs.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">No medication history</h3>
        <p className="text-muted-foreground mt-2">
          You haven't logged any medications yet. Start tracking your medications
          to see your history here.
        </p>
      </div>
    );
  }
  
  return (
    <ScrollArea className="h-[600px] pr-4">
      <div className="space-y-8">
        {sortedDates.map(date => (
          <div key={date}>
            <h3 className="font-medium mb-4 sticky top-0 bg-background py-2">
              {new Date(date).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </h3>
            
            <div className="space-y-4">
              {groupedLogs[date].map((log: any) => (
                <MedicationLogItem key={log.id} log={log} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

function MedicationLogItem({ log }: { log: any }) {
  // Fetch schedule
  const { data: schedule } = useQuery({
    queryKey: ['/api/schedules', log.scheduleId],
    queryFn: async () => {
      const response = await fetch(`/api/schedules/${log.scheduleId}`);
      if (!response.ok) return null;
      return response.json();
    }
  });
  
  // Fetch medicine (if schedule is available)
  const { data: medicine } = useQuery({
    queryKey: ['/api/medicines', schedule?.medicineId],
    queryFn: async () => {
      if (!schedule) return null;
      const response = await fetch(`/api/medicines/${schedule.medicineId}`);
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!schedule
  });
  
  if (!schedule || !medicine) {
    return null; // Don't show logs for deleted schedules
  }
  
  return (
    <div className="flex items-center p-4 border rounded-md">
      <div className={`p-2 rounded-full mr-4 ${
        log.status === 'taken' 
          ? 'bg-green-100 text-green-700' 
          : 'bg-amber-100 text-amber-700'
      }`}>
        {log.status === 'taken' ? (
          <CheckCircle className="h-6 w-6" />
        ) : (
          <XCircle className="h-6 w-6" />
        )}
      </div>
      
      <div className="flex-1">
        <h4 className="font-medium">{medicine.name}</h4>
        <p className="text-sm text-muted-foreground">
          {schedule.dosage} {schedule.dosageUnit}
          {schedule.instructions && ` - ${schedule.instructions}`}
        </p>
      </div>
      
      <div className="text-right">
        <p className="text-sm font-medium">
          {new Date(log.takenAt).toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true
          })}
        </p>
        <p className="text-xs text-muted-foreground">
          {log.status === 'taken' ? 'Taken' : 'Skipped'}
        </p>
      </div>
    </div>
  );
}