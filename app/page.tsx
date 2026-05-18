"use client";

import { useState } from "react";
import { 
  Briefcase, 
  LayoutDashboard, 
  Settings, 
  Send, 
  FileText, 
  Users, 
  BrainCircuit,
  Search,
  Bell
} from "lucide-react";

export default function Dashboard() {
  const [jobUrl, setJobUrl] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobUrl) return;
    setIsProcessing(true);
    // TODO: Wire up to Convex mutation to create lead and start vetting
    setTimeout(() => setIsProcessing(false), 2000); // Mock processing
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border glass-panel flex flex-col justify-between hidden md:flex m-4 mr-0 z-10 animate-fade-in">
        <div>
          <div className="h-16 flex items-center px-6 border-b border-border">
            <BrainCircuit className="h-8 w-8 text-primary mr-3" />
            <span className="font-bold text-xl tracking-tight">PitchPilot</span>
          </div>
          <nav className="p-4 space-y-2 mt-4">
            <a href="#" className="flex items-center px-4 py-3 bg-primary/10 text-primary rounded-lg font-medium transition-colors">
              <LayoutDashboard className="h-5 w-5 mr-3" />
              Dashboard
            </a>
            <a href="#" className="flex items-center px-4 py-3 text-muted-foreground hover:bg-muted/50 rounded-lg font-medium transition-colors">
              <Briefcase className="h-5 w-5 mr-3" />
              Active Pitches
            </a>
            <a href="#" className="flex items-center px-4 py-3 text-muted-foreground hover:bg-muted/50 rounded-lg font-medium transition-colors">
              <Users className="h-5 w-5 mr-3" />
              Client Dossiers
            </a>
            <a href="#" className="flex items-center px-4 py-3 text-muted-foreground hover:bg-muted/50 rounded-lg font-medium transition-colors">
              <FileText className="h-5 w-5 mr-3" />
              Proposals
            </a>
          </nav>
        </div>
        <div className="p-4">
          <a href="#" className="flex items-center px-4 py-3 text-muted-foreground hover:bg-muted/50 rounded-lg font-medium transition-colors">
            <Settings className="h-5 w-5 mr-3" />
            Settings
          </a>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden m-4 z-10">
        {/* Header */}
        <header className="h-16 glass-panel mb-4 flex items-center justify-between px-6 animate-fade-in delay-100">
          <div className="flex items-center text-sm text-muted-foreground">
            <span>Overview</span>
            <span className="mx-2">/</span>
            <span className="text-foreground font-medium">New Pitch</span>
          </div>
          <div className="flex items-center space-x-4">
            <button className="text-muted-foreground hover:text-foreground transition-colors">
              <Search className="h-5 w-5" />
            </button>
            <button className="text-muted-foreground hover:text-foreground transition-colors relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-primary rounded-full"></span>
            </button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white font-bold text-xs shadow-lg">
              ME
            </div>
          </div>
        </header>

        {/* Content Scrollable Area */}
        <div className="flex-1 overflow-auto rounded-lg animate-fade-in delay-200">
          <div className="max-w-4xl mx-auto py-8">
            <div className="text-center mb-10">
              <h1 className="text-4xl font-extrabold tracking-tight mb-3">Deploy Your Digital BDR</h1>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Paste a job posting URL or brief below. PitchPilot will vet the lead, find the decision-maker, and draft a hyper-personalized proposal.
              </p>
            </div>

            {/* Intake Form */}
            <form onSubmit={handleSubmit} className="glass-card p-6 mb-8 flex flex-col sm:flex-row gap-4 items-center">
              <div className="relative flex-1 w-full">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Briefcase className="h-5 w-5 text-muted-foreground" />
                </div>
                <input
                  type="url"
                  placeholder="https://www.upwork.com/jobs/..."
                  className="w-full bg-background border border-border rounded-lg py-4 pl-12 pr-4 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-inner"
                  value={jobUrl}
                  onChange={(e) => setJobUrl(e.target.value)}
                  required
                />
              </div>
              <button 
                type="submit" 
                disabled={isProcessing}
                className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-4 px-8 rounded-lg transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(109,40,217,0.5)] hover:shadow-[0_0_25px_rgba(109,40,217,0.7)]"
              >
                {isProcessing ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analyzing...
                  </span>
                ) : (
                  <>
                    <Send className="h-5 w-5 mr-2" />
                    Vet Lead
                  </>
                )}
              </button>
            </form>

            {/* Empty State Cards (Observer Pattern Placeholder) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in delay-300">
              <div className="glass-card p-6 flex flex-col items-center justify-center text-center h-48 opacity-50">
                <BrainCircuit className="h-8 w-8 text-muted-foreground mb-3" />
                <h3 className="font-semibold mb-1">Strategic Vetting</h3>
                <p className="text-sm text-muted-foreground">Waiting for URL input...</p>
              </div>
              <div className="glass-card p-6 flex flex-col items-center justify-center text-center h-48 opacity-50">
                <Users className="h-8 w-8 text-muted-foreground mb-3" />
                <h3 className="font-semibold mb-1">Client Dossier</h3>
                <p className="text-sm text-muted-foreground">Waiting for vetting completion...</p>
              </div>
              <div className="glass-card p-6 flex flex-col items-center justify-center text-center h-48 opacity-50">
                <FileText className="h-8 w-8 text-muted-foreground mb-3" />
                <h3 className="font-semibold mb-1">Proposal & Pitch</h3>
                <p className="text-sm text-muted-foreground">Waiting for dossier insights...</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
