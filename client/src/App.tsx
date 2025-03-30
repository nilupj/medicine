import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Admin from "@/pages/Admin";
import Login from "@/pages/Login";
import Reminders from "@/pages/Reminders";
import NewReminder from "@/pages/NewReminder";
import EditReminder from "@/pages/EditReminder";
import { useEffect } from "react";

// Navigation component that handles active link styling
function Navigation() {
  const [location] = useLocation();
  
  return (
    <nav className="bg-primary text-primary-foreground shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex">
            <a href="/" className="text-xl font-bold">
              MedTracker
            </a>
          </div>
          
          <div className="flex space-x-4">
            <a 
              href="/" 
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                location === '/' ? 'bg-primary-foreground/20' : 'hover:bg-primary-foreground/10'
              }`}
            >
              Home
            </a>
            <a 
              href="/reminders" 
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                location.startsWith('/reminders') ? 'bg-primary-foreground/20' : 'hover:bg-primary-foreground/10'
              }`}
            >
              Reminders
            </a>
            <a 
              href="/login" 
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                location === '/login' ? 'bg-primary-foreground/20' : 'hover:bg-primary-foreground/10'
              }`}
            >
              Login
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}

function Router() {
  return (
    <>
      <Navigation />
      <main>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/admin" component={Admin} />
          <Route path="/login" component={Login} />
          <Route path="/reminders" component={Reminders} />
          <Route path="/reminders/new" component={NewReminder} />
          <Route path="/reminders/edit/:id" component={EditReminder} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
