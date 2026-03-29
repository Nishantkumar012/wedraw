type AuthLayoutProps = {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
};

export const AuthLayout = ({
  children,
  title = "Whiteboard Pro",
  subtitle,
}: AuthLayoutProps) => {
  return (
    // <div className="min-h-screen flex flex-col bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100">
        <div className="min-h-screen flex flex-col bg-white font-display text-slate-900">
      
      {/* 🔥 Header */}
      <header className="w-full px-6 md:px-20 py-4 flex items-center justify-between bg-white/60 dark:bg-background-dark/60 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50">
        
        {/* Logo */}
        <div className="flex items-center gap-2 text-primary">
          <span className="material-symbols-outlined text-3xl">
            dashboard
          </span>
          <h1 className="text-xl font-bold tracking-tight">
            {title}
          </h1>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          <span className="hidden md:block text-sm text-slate-500">
            Need help?
          </span>

          <button className="px-4 py-2 text-sm font-semibold rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition">
            Sign In
          </button>
        </div>
      </header>

      {/* 🔥 Main Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        
        <div className="w-full max-w-[480px]">
          
          {/* Optional subtitle */}
          {subtitle && (
            <p className="text-center text-slate-500 mb-6">
              {subtitle}
            </p>
          )}

          {children}
        </div>

      </main>

      {/* 🔥 Footer */}
      <footer className="w-full py-6 px-6 md:px-20 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-400">
        
        <p>© 2026 Whiteboard Pro. All rights reserved.</p>

        <div className="flex gap-6">
          <span className="hover:text-primary cursor-pointer">
            Privacy Policy
          </span>
          <span className="hover:text-primary cursor-pointer">
            Terms
          </span>
          <span className="hover:text-primary cursor-pointer">
            Support
          </span>
        </div>

      </footer>
    </div>
  );
};