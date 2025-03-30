import { 
  MedicationSchedule, 
  ScheduleFrequency, 
  ReminderTime,
  MedicationLog
} from "@shared/schema";
import { apiRequest, queryClient } from "./queryClient";

/**
 * Formats a time string (HH:MM) for display
 */
export function formatTimeString(timeStr: string): string {
  try {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours);
    date.setMinutes(minutes);
    
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    });
  } catch (e) {
    return timeStr; // Return original if parsing fails
  }
}

/**
 * Convert frequency type to human-readable format
 */
export function formatFrequencyType(frequencyType: string): string {
  switch (frequencyType) {
    case 'daily':
      return 'Daily';
    case 'weekly':
      return 'Weekly';
    case 'monthly':
      return 'Monthly';
    case 'as_needed':
      return 'As Needed';
    default:
      return frequencyType;
  }
}

/**
 * Convert days of week array to human-readable format
 */
export function formatDaysOfWeek(daysOfWeek: number[]): string {
  if (!daysOfWeek || daysOfWeek.length === 0) return 'None';
  
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  // Handle special cases
  if (daysOfWeek.length === 7) return 'Every day';
  if (daysOfWeek.length === 5 && 
      daysOfWeek.includes(1) && daysOfWeek.includes(2) && 
      daysOfWeek.includes(3) && daysOfWeek.includes(4) && 
      daysOfWeek.includes(5)) {
    return 'Weekdays';
  }
  if (daysOfWeek.length === 2 && 
      daysOfWeek.includes(0) && daysOfWeek.includes(6)) {
    return 'Weekends';
  }
  
  // Default: list all days
  return daysOfWeek.map(day => dayNames[day]).join(', ');
}

/**
 * Get all medication schedules for the current user
 */
export async function getMedicationSchedules(): Promise<MedicationSchedule[]> {
  return apiRequest<MedicationSchedule[]>('/api/schedules');
}

/**
 * Get a specific medication schedule
 */
export async function getMedicationSchedule(id: number): Promise<MedicationSchedule> {
  return apiRequest<MedicationSchedule>(`/api/schedules/${id}`);
}

/**
 * Create a new medication schedule
 */
export async function createMedicationSchedule(data: any): Promise<MedicationSchedule> {
  const schedule = await apiRequest<MedicationSchedule>('/api/schedules', {
    method: 'POST',
    body: JSON.stringify(data)
  });
  
  // Invalidate schedules cache
  queryClient.invalidateQueries({ queryKey: ['/api/schedules'] });
  
  return schedule;
}

/**
 * Update an existing medication schedule
 */
export async function updateMedicationSchedule(id: number, data: any): Promise<MedicationSchedule> {
  const schedule = await apiRequest<MedicationSchedule>(`/api/schedules/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  });
  
  // Invalidate schedules cache
  queryClient.invalidateQueries({ queryKey: ['/api/schedules'] });
  queryClient.invalidateQueries({ queryKey: ['/api/schedules', id] });
  
  return schedule;
}

/**
 * Delete a medication schedule
 */
export async function deleteMedicationSchedule(id: number): Promise<void> {
  await apiRequest(`/api/schedules/${id}`, {
    method: 'DELETE'
  });
  
  // Invalidate schedules cache
  queryClient.invalidateQueries({ queryKey: ['/api/schedules'] });
}

/**
 * Get schedule frequency
 */
export async function getScheduleFrequency(scheduleId: number): Promise<ScheduleFrequency> {
  return apiRequest<ScheduleFrequency>(`/api/schedules/${scheduleId}/frequency`);
}

/**
 * Create schedule frequency
 */
export async function createScheduleFrequency(scheduleId: number, data: any): Promise<ScheduleFrequency> {
  const frequency = await apiRequest<ScheduleFrequency>(`/api/schedules/${scheduleId}/frequency`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
  
  // Invalidate frequency cache
  queryClient.invalidateQueries({ queryKey: ['/api/schedules', scheduleId, 'frequency'] });
  
  return frequency;
}

/**
 * Get reminder times for a schedule
 */
export async function getReminderTimes(scheduleId: number): Promise<ReminderTime[]> {
  return apiRequest<ReminderTime[]>(`/api/schedules/${scheduleId}/reminders`);
}

/**
 * Create a reminder time
 */
export async function createReminderTime(scheduleId: number, data: any): Promise<ReminderTime> {
  const reminder = await apiRequest<ReminderTime>(`/api/schedules/${scheduleId}/reminders`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
  
  // Invalidate reminders cache
  queryClient.invalidateQueries({ queryKey: ['/api/schedules', scheduleId, 'reminders'] });
  
  return reminder;
}

/**
 * Delete a reminder time
 */
export async function deleteReminderTime(id: number): Promise<void> {
  await apiRequest(`/api/reminders/${id}`, {
    method: 'DELETE'
  });
  
  // We don't know which schedule this belongs to, so invalidate all schedules
  queryClient.invalidateQueries({ queryKey: ['/api/schedules'] });
}

/**
 * Get medication logs for a schedule
 */
export async function getMedicationLogs(scheduleId: number): Promise<MedicationLog[]> {
  return apiRequest<MedicationLog[]>(`/api/schedules/${scheduleId}/logs`);
}

/**
 * Log a medication event
 */
export async function logMedication(scheduleId: number, data: any): Promise<MedicationLog> {
  const log = await apiRequest<MedicationLog>(`/api/schedules/${scheduleId}/logs`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
  
  // Invalidate logs cache
  queryClient.invalidateQueries({ queryKey: ['/api/schedules', scheduleId, 'logs'] });
  queryClient.invalidateQueries({ queryKey: ['/api/logs'] });
  
  return log;
}

/**
 * Get all medication logs for the current user
 */
export async function getAllMedicationLogs(): Promise<MedicationLog[]> {
  return apiRequest<MedicationLog[]>('/api/logs');
}

/**
 * Check if a medication is due to be taken
 */
export function isMedicationDue(schedule: MedicationSchedule, frequency: ScheduleFrequency, reminders: ReminderTime[]): boolean {
  if (!frequency) return false;
  
  const now = new Date();
  const currentDay = now.getDay(); // 0-6, where 0 is Sunday
  
  switch (frequency.frequencyType) {
    case 'daily':
      return reminders.some(reminder => {
        const [hours, minutes] = reminder.time.split(':').map(Number);
        const reminderDate = new Date();
        reminderDate.setHours(hours, minutes, 0, 0);
        
        // Due if within 30 minutes of reminder time
        const timeDiff = Math.abs(now.getTime() - reminderDate.getTime());
        return timeDiff <= 30 * 60 * 1000; // 30 minutes in milliseconds
      });
      
    case 'weekly':
      // First check if today is one of the scheduled days
      if (!frequency.daysOfWeek?.includes(currentDay)) return false;
      
      // Then check if any reminder time is due
      return reminders.some(reminder => {
        const [hours, minutes] = reminder.time.split(':').map(Number);
        const reminderDate = new Date();
        reminderDate.setHours(hours, minutes, 0, 0);
        
        // Due if within 30 minutes of reminder time
        const timeDiff = Math.abs(now.getTime() - reminderDate.getTime());
        return timeDiff <= 30 * 60 * 1000; // 30 minutes in milliseconds
      });
      
    case 'monthly':
      const currentDate = now.getDate();
      
      // Check if today is the scheduled day of month
      if (frequency.dayOfMonth !== currentDate) return false;
      
      // Then check if any reminder time is due
      return reminders.some(reminder => {
        const [hours, minutes] = reminder.time.split(':').map(Number);
        const reminderDate = new Date();
        reminderDate.setHours(hours, minutes, 0, 0);
        
        // Due if within 30 minutes of reminder time
        const timeDiff = Math.abs(now.getTime() - reminderDate.getTime());
        return timeDiff <= 30 * 60 * 1000; // 30 minutes in milliseconds
      });
      
    case 'as_needed':
      // As needed medications aren't automatically due
      return false;
      
    default:
      return false;
  }
}