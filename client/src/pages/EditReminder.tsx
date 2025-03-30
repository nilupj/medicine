import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useLocation, useParams } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getCurrentUser } from '@/lib/auth';
import { 
  getMedicationSchedule,
  getScheduleFrequency,
  getReminderTimes,
  updateMedicationSchedule,
  createReminderTime,
  deleteReminderTime
} from '@/lib/reminders';
import { queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { CalendarIcon, Clock } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Textarea } from '@/components/ui/textarea';

// Form schema
const formSchema = z.object({
  dosage: z.coerce.number().min(0.1, 'Dosage must be greater than 0'),
  dosageUnit: z.string().min(1, 'Please select a dosage unit'),
  instructions: z.string().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  reminderTimes: z.array(z.string()).min(1, 'Add at least one reminder time'),
});

type FormValues = z.infer<typeof formSchema>;

export default function EditReminderPage() {
  const params = useParams();
  const scheduleId = parseInt(params.id || '0');
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [existingReminderTimes, setExistingReminderTimes] = useState<any[]>([]);
  
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
        description: "Please login to edit medication reminders",
        variant: "destructive",
      });
      setLocation('/login');
    }
  }, [user, isLoadingUser, setLocation, toast]);
  
  // Fetch schedule data
  const { data: schedule, isLoading: isLoadingSchedule } = useQuery({
    queryKey: ['/api/schedules', scheduleId],
    queryFn: () => getMedicationSchedule(scheduleId),
    enabled: !!user && scheduleId > 0,
    onError: () => {
      toast({
        title: "Schedule not found",
        description: "The medication schedule could not be loaded",
        variant: "destructive",
      });
      setLocation('/reminders');
    }
  });
  
  // Fetch medicine details
  const { data: medicine } = useQuery({
    queryKey: ['/api/medicines', schedule?.medicineId],
    queryFn: async () => {
      if (!schedule) return null;
      const response = await fetch(`/api/medicines/${schedule.medicineId}`);
      if (!response.ok) throw new Error('Failed to fetch medicine');
      return response.json();
    },
    enabled: !!schedule
  });
  
  // Fetch reminder times
  const { data: reminders = [] } = useQuery({
    queryKey: ['/api/schedules', scheduleId, 'reminders'],
    queryFn: () => getReminderTimes(scheduleId),
    enabled: !!user && scheduleId > 0,
    onSuccess: (data) => {
      // Convert reminders to form format and set initial form values
      const reminderTimes = data.map(r => r.time);
      
      // Save the original reminder objects for reference (we need the IDs)
      setExistingReminderTimes(data);
      
      // Set form values
      if (reminderTimes.length > 0) {
        form.setValue('reminderTimes', reminderTimes);
      }
    }
  });
  
  // Form with default values
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      dosage: 1,
      dosageUnit: 'mg',
      instructions: '',
      reminderTimes: ['08:00'],
    },
  });
  
  // Update form when schedule data is loaded
  useEffect(() => {
    if (schedule) {
      form.setValue('dosage', schedule.dosage);
      form.setValue('dosageUnit', schedule.dosageUnit);
      form.setValue('instructions', schedule.instructions || '');
      
      if (schedule.startDate) {
        form.setValue('startDate', new Date(schedule.startDate));
      }
      
      if (schedule.endDate) {
        form.setValue('endDate', new Date(schedule.endDate));
      }
    }
  }, [schedule, form]);
  
  // Update schedule mutation
  const updateScheduleMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      if (!schedule) throw new Error('Schedule not found');
      
      // Update the schedule
      await updateMedicationSchedule(scheduleId, {
        dosage: data.dosage,
        dosageUnit: data.dosageUnit,
        instructions: data.instructions,
        startDate: data.startDate,
        endDate: data.endDate,
      });
      
      // Handle reminder times
      const existingTimes = existingReminderTimes.map(r => r.time);
      const newTimes = data.reminderTimes.filter(time => !existingTimes.includes(time));
      const removedReminders = existingReminderTimes.filter(r => !data.reminderTimes.includes(r.time));
      
      // Add new reminder times
      for (const time of newTimes) {
        await createReminderTime(scheduleId, { time });
      }
      
      // Remove deleted reminder times
      for (const reminder of removedReminders) {
        await deleteReminderTime(reminder.id);
      }
      
      return schedule;
    },
    onSuccess: () => {
      toast({
        title: "Reminder updated",
        description: "Your medication reminder has been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/schedules'] });
      queryClient.invalidateQueries({ queryKey: ['/api/schedules', scheduleId] });
      queryClient.invalidateQueries({ queryKey: ['/api/schedules', scheduleId, 'reminders'] });
      setLocation('/reminders');
    },
    onError: (error) => {
      console.error('Error updating reminder:', error);
      toast({
        title: "Failed to update reminder",
        description: "There was a problem updating your medication reminder",
        variant: "destructive",
      });
    }
  });
  
  // Handle form submission
  const onSubmit = async (data: FormValues) => {
    try {
      await updateScheduleMutation.mutateAsync(data);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };
  
  // Add reminder time
  const addReminderTime = () => {
    const times = form.getValues('reminderTimes');
    form.setValue('reminderTimes', [...times, '12:00']);
  };
  
  // Remove reminder time
  const removeReminderTime = (index: number) => {
    const times = form.getValues('reminderTimes');
    if (times.length > 1) {
      form.setValue('reminderTimes', times.filter((_, i) => i !== index));
    }
  };
  
  // Dosage unit options
  const dosageUnits = ['mg', 'mcg', 'g', 'ml', 'tablet', 'capsule', 'patch', 'drop', 'spray', 'unit'];
  
  // Loading state
  if (isLoadingUser || isLoadingSchedule) {
    return (
      <div className="container mx-auto py-10 flex items-center justify-center">
        <p>Loading reminder information...</p>
      </div>
    );
  }
  
  // Not authenticated
  if (!user) {
    return null; // Will redirect via useEffect
  }
  
  // Schedule not found
  if (!schedule) {
    return null; // Will redirect via useEffect
  }
  
  return (
    <div className="container mx-auto py-10 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>Edit Medication Reminder</CardTitle>
          <CardDescription>
            Update details for {medicine?.name || 'medication'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Dosage */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="dosage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dosage</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" min="0.1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="dosageUnit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select unit" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {dosageUnits.map(unit => (
                            <SelectItem key={unit} value={unit}>
                              {unit}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Instructions */}
              <FormField
                control={form.control}
                name="instructions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instructions</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Take with food, etc."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Optional instructions for taking this medication
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Start and End Dates */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Start Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormDescription>
                        When to start taking this medication
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>End Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => {
                              const startDate = form.getValues('startDate');
                              return startDate && date < startDate;
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormDescription>
                        Optional end date for this medication
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Reminder Times */}
              <div>
                <FormLabel>Reminder Times</FormLabel>
                <FormDescription className="mb-2">
                  Set times to be reminded to take this medication
                </FormDescription>
                
                <div className="space-y-2">
                  {form.getValues('reminderTimes').map((time, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <FormField
                        control={form.control}
                        name={`reminderTimes.${index}`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input
                                type="time"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        type="button"
                        className="text-destructive"
                        onClick={() => removeReminderTime(index)}
                        disabled={form.getValues('reminderTimes').length <= 1}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
                
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={addReminderTime}
                >
                  Add Time
                </Button>
                
                {form.formState.errors.reminderTimes?.message && (
                  <p className="text-sm text-destructive mt-2">
                    {form.formState.errors.reminderTimes.message}
                  </p>
                )}
              </div>
              
              <div className="flex justify-end space-x-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation('/reminders')}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={updateScheduleMutation.isPending}
                >
                  {updateScheduleMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}