import { Link } from "wouter";
import { Shield, ArrowLeft } from "lucide-react";

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="glass-card p-12 text-center max-w-md w-full">
        <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-indigo-500/20 to-violet-600/20 border border-indigo-500/20 rounded-2xl flex items-center justify-center">
          <Shield className="w-8 h-8 text-[var(--pg-primary-light)]" />
        </div>
        <h1 className="text-5xl font-bold gradient-text mb-3">404</h1>
        <p className="text-lg text-[var(--pg-text-secondary)] mb-8">Page not found</p>
        <Link href="/">
          <button className="btn-primary">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;