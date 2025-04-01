import React from "react";
import { GetServerSideProps } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { getSession } from "next-auth/react";
import Link from "next/link";
import NavBar from "../components/NavBar";
import { MedicationSchedule, Medicine } from "../../shared/schema";

interface RemindersPageProps {
  reminders: Array<MedicationSchedule & {
    medicine: Medicine;
    reminderTimes: Array<{ id: number; time: string; enabled: boolean }>;
  }>;
  upcomingReminders: Array<{
    id: number;
    medicineName: string;
    scheduledTime: string;
    scheduledDate: string;
  }>;
}

export default function RemindersPage({ reminders, upcomingReminders }: RemindersPageProps) {
  const router = useRouter();

  return (
    <>
      <Head>
        <title>Your Medication Reminders | Medicine App</title>
        <meta
          name="description"
          content="View and manage your medication reminders. Get notifications when it's time to take your medications."
        />
      </Head>

      <NavBar />

      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Your Medication Reminders</h1>
          <Link href="/reminders/new">
            <a className="bg-primary text-white px-4 py-2 rounded-md">
              Add New Reminder
            </a>
          </Link>
        </div>

        {upcomingReminders.length > 0 ? (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
            <h2 className="text-xl font-semibold mb-3">Upcoming Reminders</h2>
            <div className="space-y-2">
              {upcomingReminders.map((reminder) => (
                <div key={reminder.id} className="flex items-center justify-between bg-white p-3 rounded-md shadow-sm">
                  <div>
                    <p className="font-medium">{reminder.medicineName}</p>
                    <p className="text-sm text-gray-600">
                      {reminder.scheduledDate} at {reminder.scheduledTime}
                    </p>
                  </div>
                  <button className="text-blue-600 hover:text-blue-800">
                    Mark as Taken
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-8 text-center">
            <p>No upcoming reminders scheduled.</p>
          </div>
        )}

        <h2 className="text-2xl font-semibold mb-4">All Medications</h2>
        
        {reminders.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reminders.map((schedule) => (
              <div key={schedule.id} className="bg-white rounded-lg shadow p-5">
                <h3 className="text-xl font-semibold">{schedule.medicine.name}</h3>
                <p className="text-gray-600 mb-2">{schedule.medicine.category}</p>
                
                <div className="mb-3">
                  <p className="text-sm font-medium">Dosage:</p>
                  <p>{schedule.dosage || "Not specified"}</p>
                </div>
                
                <div className="mb-3">
                  <p className="text-sm font-medium">Reminder Times:</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {schedule.reminderTimes.map((time) => (
                      <span 
                        key={time.id}
                        className={`text-xs px-2 py-1 rounded ${
                          time.enabled 
                            ? "bg-green-100 text-green-800" 
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {time.time}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="flex space-x-2 mt-4">
                  <button
                    onClick={() => router.push(`/reminders/${schedule.id}`)}
                    className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-md text-sm hover:bg-blue-700"
                  >
                    Edit
                  </button>
                  <button
                    className="flex-1 bg-red-600 text-white py-2 px-3 rounded-md text-sm hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
            <h3 className="text-xl font-medium mb-2">No medication reminders yet</h3>
            <p className="text-gray-600 mb-4">
              Add your first medication reminder to get started.
            </p>
            <Link href="/reminders/new">
              <a className="inline-block bg-primary text-white px-4 py-2 rounded-md">
                Add Your First Reminder
              </a>
            </Link>
          </div>
        )}
      </div>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context);

  if (!session || !session.user) {
    return {
      redirect: {
        destination: "/login?returnUrl=/reminders",
        permanent: false,
      },
    };
  }

  try {
    // Get user ID from session
    const userId = (session.user as any).id;

    // Here we would fetch data from our API
    const reminderResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/reminders?userId=${userId}`);
    const remindersData = await reminderResponse.json();
    
    // Calculate upcoming reminders (next 24 hours)
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    // This would be implemented based on your reminder logic and data structure
    const upcomingReminders: any[] = []; // Would come from your API

    return {
      props: {
        reminders: remindersData.reminders || [],
        upcomingReminders: upcomingReminders || [],
      },
    };
  } catch (error) {
    console.error("Error fetching reminders:", error);
    
    return {
      props: {
        reminders: [],
        upcomingReminders: [],
        error: "Failed to load your reminders. Please try again."
      },
    };
  }
};