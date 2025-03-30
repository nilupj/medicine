import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getCurrentUser } from '@/lib/auth';
import { 
  createMedicationSchedule,
  createScheduleFrequency,
  createReminderTime
} from '@/lib/reminders';
import { queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { CalendarIcon, Clock, Search } from 'lucide-react';
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
import { Checkbox } from '@/components/ui/checkbox';

// Form schema for new medication schedule
const formSchema = z.object({
  medicineId: z.coerce.number().min(1, 'Please select a medication'),
  dosage: z.coerce.number().min(0.1, 'Dosage must be greater than 0'),
  dosageUnit: z.string().min(1, 'Please select a dosage unit'),
  instructions: z.string().optional(),
  frequencyType: z.enum(['daily', 'weekly', 'monthly', 'as_needed']),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  // For weekly frequency
  daysOfWeek: z.array(z.number()).optional(),
  // For monthly frequency
  dayOfMonth: z.coerce.number().min(1).max(31).optional(),
  // Reminder times
  reminderTimes: z.array(z.string()).min(1, 'Add at least one reminder time'),
});

type FormValues = z.infer<typeof formSchema>;

export default function NewReminderPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
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
        description: "Please login to create medication reminders",
        variant: "destructive",
      });
      setLocation('/login');
    }
  }, [user, isLoadingUser, setLocation, toast]);
  
  // Form with default values
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      medicineId: 0,
      dosage: 1,
      dosageUnit: 'mg',
      instructions: '',
      frequencyType: 'daily',
      reminderTimes: ['08:00'],
      daysOfWeek: [1, 2, 3, 4, 5], // Monday to Friday by default
      dayOfMonth: 1,
    },
  });
  
  // Watch frequency type to show/hide relevant fields
  const frequencyType = form.watch('frequencyType');
  
  // Create medication schedule mutation
  const createScheduleMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      // First, create the schedule
      const schedule = await createMedicationSchedule({
        medicineId: data.medicineId,
        dosage: data.dosage,
        dosageUnit: data.dosageUnit,
        instructions: data.instructions,
        startDate: data.startDate,
        endDate: data.endDate,
      });
      
      // Then create frequency
      await createScheduleFrequency(schedule.id, {
        frequencyType: data.frequencyType,
        daysOfWeek: data.frequencyType === 'weekly' ? data.daysOfWeek : undefined,
        dayOfMonth: data.frequencyType === 'monthly' ? data.dayOfMonth : undefined,
      });
      
      // Finally create reminder times
      for (const time of data.reminderTimes) {
        await createReminderTime(schedule.id, { time });
      }
      
      return schedule;
    },
    onSuccess: () => {
      toast({
        title: "Reminder created",
        description: "Your medication reminder has been created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/schedules'] });
      setLocation('/reminders');
    },
    onError: (error) => {
      console.error('Error creating reminder:', error);
      toast({
        title: "Failed to create reminder",
        description: "There was a problem creating your medication reminder",
        variant: "destructive",
      });
    }
  });
  
  // Handle form submission
  const onSubmit = async (data: FormValues) => {
    try {
      await createScheduleMutation.mutateAsync(data);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };
  
  // Handle medicine search
  const handleSearch = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    try {
      const response = await fetch(`/api/medicines/search/${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data);
      }
    } catch (error) {
      console.error('Error searching medicines:', error);
    } finally {
      setIsSearching(false);
    }
  };
  
  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery) {
        handleSearch(searchQuery);
      }
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);
  
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
  
  // Days of week options
  const daysOfWeek = [
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' },
  ];
  
  // Days of month options
  const daysOfMonth = Array.from({ length: 31 }, (_, i) => ({
    value: i + 1,
    label: `${i + 1}${getDaySuffix(i + 1)}`
  }));
  
  // Helper function for day suffixes
  function getDaySuffix(day: number): string {
    if (day >= 11 && day <= 13) return 'th';
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  }
  
  // Dosage unit options
  const dosageUnits = ['mg', 'mcg', 'g', 'ml', 'tablet', 'capsule', 'patch', 'drop', 'spray', 'unit'];
  
  if (isLoadingUser) {
    return (
      <div className="container mx-auto py-10 flex items-center justify-center">
        <p>Loading user information...</p>
      </div>
    );
  }
  
  if (!user) {
    return null; // Will redirect via useEffect
  }
  
  return (
    <div className="container mx-auto py-10 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>Add Medication Reminder</CardTitle>
          <CardDescription>
            Create a new medication schedule with reminders
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Medicine Selection */}
              <div className="space-y-4">
                <FormLabel>Medication</FormLabel>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search for a medication..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                {isSearching && <p className="text-sm">Searching...</p>}
                
                {searchResults.length > 0 && (
                  <div className="border rounded-md overflow-hidden">
                    <div className="max-h-60 overflow-y-auto">
                      {searchResults.map((medicine) => (
                        <div
                          key={medicine.id}
                          className="p-3 border-b last:border-b-0 hover:bg-accent cursor-pointer"
                          onClick={() => {
                            form.setValue('medicineId', medicine.id);
                            setSearchQuery(medicine.name);
                            setSearchResults([]);
                          }}
                        >
                          <p className="font-medium">{medicine.name}</p>
                          {medicine.category && (
                            <p className="text-sm text-muted-foreground">
                              {medicine.category.split(',')[0]}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {form.formState.errors.medicineId && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.medicineId.message}
                  </p>
                )}
              </div>
              
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
                            disabled={(date) =>
                              date < new Date(new Date().setHours(0, 0, 0, 0))
                            }
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
              
              {/* Frequency Type */}
              <FormField
                control={form.control}
                name="frequencyType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frequency</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="as_needed">As Needed (PRN)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      How often you need to take this medication
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Weekly Frequency Options */}
              {frequencyType === 'weekly' && (
                <FormField
                  control={form.control}
                  name="daysOfWeek"
                  render={() => (
                    <FormItem>
                      <div className="mb-4">
                        <FormLabel className="text-base">Days of Week</FormLabel>
                        <FormDescription>
                          Select the days when you need to take this medication
                        </FormDescription>
                      </div>
                      <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
                        {daysOfWeek.map((day) => (
                          <FormField
                            key={day.value}
                            control={form.control}
                            name="daysOfWeek"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={day.value}
                                  className="flex flex-row items-start space-x-2 space-y-0"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(day.value)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...field.value || [], day.value])
                                          : field.onChange(
                                              field.value?.filter(
                                                (value) => value !== day.value
                                              )
                                            )
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal">
                                    {day.label}
                                  </FormLabel>
                                </FormItem>
                              )
                            }}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              {/* Monthly Frequency Options */}
              {frequencyType === 'monthly' && (
                <FormField
                  control={form.control}
                  name="dayOfMonth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Day of Month</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))} 
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select day" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {daysOfMonth.map(day => (
                            <SelectItem key={day.value} value={day.value.toString()}>
                              {day.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Which day of the month to take this medication
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
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
                  disabled={createScheduleMutation.isPending}
                >
                  {createScheduleMutation.isPending ? 'Creating...' : 'Create Reminder'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}