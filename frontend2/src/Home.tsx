import { Play, Settings, History, ZoomIn, Layers, MessageCircle, MousePointer2, Edit3, Square, Users, Sparkles, Database } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Sync canvas size with CSS
    const syncSize = () => {
      const w = canvas.clientWidth || 1280;
      const h = canvas.clientHeight || 720;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    };

    syncSize();
    window.addEventListener('resize', syncSize);

    // Simple background animation
    let time = 0;
    const animate = () => {
      syncSize();
      const { width, height } = canvas;

      // Base color #EEF1F4
      ctx.fillStyle = '#EEF5F7';
      ctx.fillRect(0, 0, width, height);

      // Draw subtle moving dots
      ctx.fillStyle = 'rgba(118, 118, 131, 0.08)';
      for (let i = 0; i < 5; i++) {
        const x = (Math.sin(time * 0.0001 + i) * 0.1 + Math.sin(i * 123.456) * 0.5 + 0.5) * width;
        const y = (Math.cos(time * 0.00015 + i) * 0.1 + Math.cos(i * 234.567) * 0.5 + 0.5) * height;
        ctx.beginPath();
        ctx.arc(x, y, 40, 0, Math.PI * 2);
        ctx.fill();
      }

      time++;
      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', syncSize);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#F4FAFD] text-[#161D1F] font-sans overflow-x-hidden">
      {/* Top Navigation Bar */}
      <nav className="fixed top-0 left-0 w-full z-50 flex items-center justify-between px-6 md:px-8 bg-[#F4FAFD] h-16 raised-neumorphic">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#E2E9EC] flex items-center justify-center pressed-neumorphic">
            <svg className="w-5 h-5 text-[#4352A5] fill-current" viewBox="0 0 24 24">
              <path d="M5 12a7 7 0 1 1 14 0 7 7 0 0 1-14 0z" fillOpacity="0.3" />
              <path d="M12 5a7 7 0 1 1 0 14 7 7 0 0 1 0-14z" />
            </svg>
          </div>
          <span className="text-xl font-bold text-[#4352A5]">WeDraw</span>
        </div>

        {/* Center Navigation (Desktop) */}
        <div className="hidden md:flex items-center gap-6">
          <a href="#" className="text-[#5B5F62] font-medium text-sm hover:bg-[#E2E9EC] transition-all px-4 py-2 rounded-lg">
            Features
          </a>
          <a href="#" className="text-[#5B5F62] font-medium text-sm hover:bg-[#E2E9EC] transition-all px-4 py-2 rounded-lg">
            Pricing
          </a>
        </div>

        {/* CTA & Trailing Icons */}
        <div className="flex items-center gap-4">
          <div className="hidden md:flex gap-2">
            <button className="text-[#5B5F62] hover:bg-[#E2E9EC] transition-all p-2 rounded-full cursor-pointer">
              <Settings className="w-5 h-5" />
            </button>
            <button className="text-[#5B5F62] hover:bg-[#E2E9EC] transition-all p-2 rounded-full cursor-pointer">
              <History className="w-5 h-5" />
            </button>
          </div>
          <button
            onClick={() => navigate('/login')}
            className="text-[#5B5F62] font-medium text-sm hover:bg-[#E2E9EC] transition-all px-4 py-2 rounded-lg"
          >
            Login
          </button>
          <button
            onClick={() => navigate('/signup')}
            className="bg-[#4352A5] text-white font-semibold text-sm px-5 py-2 rounded-full raised-neumorphic-pill transition-all hover:scale-105 active:scale-95"
          >
            Sign Up
          </button>
          <button className="bg-[#F4FAFD] text-[#4352A5] font-semibold text-base px-6 py-2 rounded-full raised-neumorphic-pill active:shadow-[inset_4px_4px_10px_rgba(163,177,198,0.3),inset_-4px_-4px_10px_rgba(255,255,255,0.7)] transition-all hover:scale-105">
            Start drawing
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 md:px-8 min-h-[716px] flex flex-col items-center justify-center overflow-hidden">
        {/* Background Animation Canvas */}
        <div className="absolute inset-0 w-full h-full -z-10 opacity-30">
          <canvas ref={canvasRef} className="block w-full h-full" />
        </div>

        <div className="relative z-10 max-w-3xl text-center flex flex-col items-center">
          <h1 className="text-[32px] md:text-[32px] leading-[1.2] tracking-[-0.02em] font-bold text-[#161D1F] mb-6">
            Ideas are better together.
          </h1>
          <p className="text-base leading-[1.6] text-[#5B5F62] max-w-xl mx-auto mb-10">
            Experience a soft, tactile canvas for your team's brightest thoughts. Simple, collaborative whiteboarding that feels like a physical workspace.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button className="bg-[#4352A5] text-white font-semibold text-base px-8 py-4 rounded-full raised-neumorphic-pill transition-all hover:scale-105 active:scale-95 shadow-lg shadow-[#4352A5]/20">
              Try for free
            </button>
            <button className="bg-[#F4FAFD] text-[#4352A5] font-semibold text-base px-8 py-4 rounded-full raised-neumorphic-pill transition-all hover:scale-105 active:shadow-[inset_4px_4px_10px_rgba(163,177,198,0.3),inset_-4px_-4px_10px_rgba(255,255,255,0.7)] flex items-center justify-center gap-2">
              <Play className="w-5 h-5 fill-current" />
              See how it works
            </button>
          </div>
        </div>
      </section>

      {/* Product Preview Section */}
      <section className="px-4 md:px-8 pb-32">
        <div className="max-w-6xl mx-auto">
          {/* The Whiteboard Canvas Container (Recessed) */}
          <div className="w-full aspect-[4/3] md:aspect-[16/9] bg-[#EEF5F7] rounded-[2rem] pressed-neumorphic relative overflow-hidden border border-[#E8EFF1]">
            {/* Canvas Grid Pattern */}
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: 'radial-gradient(circle at 1px 1px, #767683 1px, transparent 0)',
                backgroundSize: '24px 24px'
              }}
            />

            {/* Floating Elements on Canvas */}
            {/* Sticky Note 1 - Yellow */}
            <div className="absolute top-[25%] left-[25%] w-40 h-40 sticky-yellow p-4 rounded-sm float-anim rotate-[-3deg] flex flex-col">
              <p className="text-sm leading-[1.5] text-[#161D1F] flex-grow">Brainstorm new flow</p>
              <div className="flex justify-between items-center mt-2">
                <div className="w-6 h-6 rounded-full bg-[#4352A5]/20 flex items-center justify-center text-[10px] font-bold text-[#4352A5]">
                  A
                </div>
                <span className="text-[#5B5F62] text-sm">👍</span>
              </div>
            </div>

            {/* Sticky Note 2 - Blue */}
            <div
              className="absolute top-[33%] right-[25%] w-48 h-48 sticky-blue p-4 rounded-sm float-anim rotate-[2deg] flex flex-col"
              style={{ animationDelay: '-2s' }}
            >
              <p className="text-sm leading-[1.5] text-[#161D1F]">Review design system components</p>
              <div className="mt-4 flex gap-2">
                <span className="inline-block w-8 h-2 bg-[#4352A5]/40 rounded-full" />
                <span className="inline-block w-12 h-2 bg-[#5B5F62]/40 rounded-full" />
              </div>
            </div>

            {/* Sticky Note 3 - Pink */}
            <div
              className="absolute bottom-[25%] left-[33%] w-36 h-36 sticky-pink p-4 rounded-sm float-anim rotate-[5deg]"
              style={{ animationDelay: '-4s' }}
            >
              <p className="text-sm leading-[1.5] text-[#161D1F]">Update icons</p>
            </div>

            {/* Shape / Diagram Element */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-[#F4FAFD] rounded-2xl raised-neumorphic flex items-center justify-center border-2 border-dashed border-[#4352A5]">
              <Database className="text-[#4352A5] w-9 h-9" />
            </div>

            {/* Connecting Arrow */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-[1]">
              <path
                d="M 350 250 C 400 250, 450 350, 550 350"
                fill="transparent"
                stroke="#5C6BC0"
                strokeDasharray="8 8"
                strokeWidth="4"
              />
              <polygon fill="#5C6BC0" points="550,350 540,345 540,355" />
            </svg>

            {/* Simulated Cursor */}
            <div className="absolute top-[30%] left-[45%] pointer-events-none z-20 cursor-animate">
              <svg className="text-[#4352A5] drop-shadow-md" fill="none" width="24" height="24" viewBox="0 0 24 24">
                <path d="M5.5 3L18 15.5L12 16.5L9.5 22L5.5 3Z" fill="currentColor" stroke="white" strokeWidth="2" />
              </svg>
              <div className="bg-[#4352A5] text-white text-[10px] px-2 py-0.5 rounded-full absolute top-6 left-2 font-bold shadow-sm whitespace-nowrap">
                Sarah M.
              </div>
            </div>

            {/* Fake Toolbar inside Preview (Bottom) */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-[#EEF5F7] rounded-full px-6 py-2 raised-neumorphic-pill flex items-center gap-8 z-30">
              <div className="flex flex-col items-center text-[#5C6BC0] font-bold cursor-pointer hover:scale-110 transition-transform">
                <ZoomIn className="w-5 h-5" strokeWidth={2.5} />
                <span className="text-[12px] leading-[1] tracking-[0.05em] font-semibold mt-1">Zoom</span>
              </div>
              <div className="flex flex-col items-center text-[#5B5F62] cursor-pointer hover:scale-110 transition-transform">
                <Layers className="w-5 h-5" />
                <span className="text-[12px] leading-[1] tracking-[0.05em] font-semibold mt-1">Layers</span>
              </div>
              <div className="flex flex-col items-center text-[#5B5F62] cursor-pointer hover:scale-110 transition-transform">
                <MessageCircle className="w-5 h-5" />
                <span className="text-[12px] leading-[1] tracking-[0.05em] font-semibold mt-1">Chat</span>
              </div>
            </div>

            {/* Fake Toolbar inside Preview (Side) */}
            <div className="absolute left-6 top-1/2 -translate-y-1/2 w-16 bg-[#F4FAFD] rounded-xl raised-neumorphic flex flex-col items-center gap-4 py-4 z-30">
              <div className="w-10 h-10 flex items-center justify-center text-[#4352A5] bg-[#DDE4E6] shadow-[inset_4px_4px_10px_rgba(163,177,198,0.3),inset_-4px_-4px_10px_rgba(255,255,255,0.7)] rounded-lg cursor-pointer">
                <MousePointer2 className="w-5 h-5" />
              </div>
              <div className="w-10 h-10 flex items-center justify-center text-[#5B5F62] hover:text-[#5C6BC0] transition-transform hover:scale-105 cursor-pointer">
                <Edit3 className="w-5 h-5" />
              </div>
              <div className="w-10 h-10 flex items-center justify-center text-[#5B5F62] hover:text-[#5C6BC0] transition-transform hover:scale-105 cursor-pointer">
                <Square className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights (Bento Grid Style) */}
      <section className="px-4 md:px-8 pb-32">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="bg-[#F4FAFD] rounded-[1.5rem] p-8 raised-neumorphic flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-full bg-[#DEE0FF] flex items-center justify-center text-[#00105B] mb-6 pressed-neumorphic">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-xl leading-[1.4] font-semibold text-[#161D1F] mb-3">Real-time Sync</h3>
              <p className="text-sm leading-[1.5] text-[#5B5F62]">
                See your teammates' cursors dance across the canvas with zero latency.
              </p>
            </div>
          </div>

          {/* Card 2 (Spans 2 cols on md) */}
          <div className="bg-[#F4FAFD] rounded-[1.5rem] p-8 raised-neumorphic flex flex-col md:flex-row items-center gap-8 md:col-span-2">
            <div className="flex-1">
              <div className="w-12 h-12 rounded-full bg-[#DEE0FF] flex items-center justify-center text-[#00105B] mb-6 pressed-neumorphic">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-xl leading-[1.4] font-semibold text-[#161D1F] mb-3">Tactile Components</h3>
              <p className="text-sm leading-[1.5] text-[#5B5F62]">
                Our unique soft-UI approach makes digital tools feel physically present, reducing eye strain and improving focus.
              </p>
            </div>
            <div className="w-full md:w-1/2 aspect-square md:aspect-auto h-48 bg-[#EEF5F7] rounded-xl pressed-neumorphic flex items-center justify-center relative overflow-hidden">
              {/* Decorative inner elements */}
              <div className="w-24 h-24 rounded-full bg-[#F4FAFD] raised-neumorphic absolute -left-4 -top-4" />
              <div className="w-16 h-16 rounded-xl bg-[#F4FAFD] raised-neumorphic absolute right-8 bottom-8 rotate-12" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;