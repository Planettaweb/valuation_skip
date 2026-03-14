import { Rocket, User, Building } from 'lucide-react'
import useAuthStore from '@/stores/useAuthStore'

export function OrbitalEcosystem() {
  const { user } = useAuthStore()

  return (
    <div className="relative w-full max-w-[800px] aspect-square mx-auto my-8 flex items-center justify-center pointer-events-none select-none">
      {/* Central Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.15)_0%,transparent_60%)]" />

      {/* Orbit Rings */}
      <div className="absolute w-[90%] h-[90%] border border-white/5 rounded-full" />
      <div className="absolute w-[90%] h-[90%] border border-primary/20 rounded-full animate-spin-slow border-dashed" />

      <div className="absolute w-[60%] h-[60%] border border-white/10 rounded-full" />
      <div className="absolute w-[60%] h-[60%] border border-purple-500/10 rounded-full animate-[spin_50s_linear_infinite_reverse] border-dashed" />

      <div className="absolute w-[30%] h-[30%] border border-primary/30 rounded-full" />

      {/* Connection Lines & Artifacts */}
      <div className="absolute bottom-[15%] left-1/2 -translate-x-1/2 w-[1px] h-[35%] bg-gradient-to-t from-primary/0 via-primary to-primary">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-[90%] w-0 h-0 border-l-[3px] border-r-[3px] border-b-[6px] border-transparent border-b-primary" />
      </div>

      {/* Dynamic Dots on rings */}
      <div className="absolute w-[60%] h-[60%] animate-[spin_20s_linear_infinite]">
        <div className="absolute -top-1.5 left-1/2 w-3 h-3 bg-primary rounded-full shadow-[0_0_15px_rgba(139,92,246,0.8)]" />
      </div>

      {/* Main Nodes (Static to keep text upright) */}

      {/* Center Node */}
      <div className="absolute w-32 h-32 bg-[#0a0a0f] border-2 border-primary/50 rounded-full flex flex-col items-center justify-center shadow-[0_0_40px_rgba(139,92,246,0.3)] z-10 glass-panel">
        <Rocket className="text-primary w-8 h-8 mb-2" />
        <span className="text-[10px] text-white font-bold tracking-wider text-center px-2">
          {user?.orgName || 'Your Company'}
        </span>
      </div>

      {/* Top Node */}
      <div className="absolute top-[10%] left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-3">
        <div className="bg-card/80 border border-white/10 px-4 py-2 rounded-xl backdrop-blur-md text-xs font-medium text-muted-foreground whitespace-nowrap">
          VP of Commercial Business
        </div>
        <img
          src="https://img.usecurling.com/ppl/thumbnail?seed=2&gender=male"
          className="w-10 h-10 rounded-full border border-primary/50 shadow-lg"
          alt="Avatar"
        />
      </div>

      {/* Bottom Node (The Buyer) */}
      <div className="absolute bottom-[-5%] left-1/2 -translate-x-1/2 translate-y-1/2 flex flex-col items-center gap-3">
        <span className="text-sm font-semibold text-primary">The Buyer</span>
        <div className="w-12 h-12 rounded-full border border-primary/50 bg-primary/10 flex items-center justify-center backdrop-blur-md">
          <User className="text-primary w-5 h-5" />
        </div>
      </div>

      {/* Left Node (Google) */}
      <div className="absolute top-[40%] left-[5%] -translate-y-1/2 flex flex-col sm:flex-row items-center gap-3">
        <img
          src="https://img.usecurling.com/ppl/thumbnail?seed=3&gender=male"
          className="w-10 h-10 rounded-full border border-white/20 shadow-lg hidden sm:block"
          alt="Avatar"
        />
        <div className="bg-card/80 border border-white/10 px-5 py-3 rounded-2xl backdrop-blur-md flex items-center gap-2 shadow-lg">
          <img
            src="https://img.usecurling.com/i?q=google&color=white&shape=fill"
            className="w-5 h-5"
            alt="Google"
          />
          <span className="text-sm font-bold tracking-wide">Google</span>
        </div>
      </div>

      {/* Right Node (J.P. Morgan) */}
      <div className="absolute top-[60%] right-[5%] -translate-y-1/2 flex flex-col sm:flex-row-reverse items-center gap-3">
        <img
          src="https://img.usecurling.com/ppl/thumbnail?seed=4&gender=female"
          className="w-10 h-10 rounded-full border border-white/20 shadow-lg hidden sm:block"
          alt="Avatar"
        />
        <div className="bg-card/80 border border-white/10 px-5 py-3 rounded-2xl backdrop-blur-md flex items-center gap-2 shadow-lg">
          <Building className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-bold tracking-wide">J.P.Morgan</span>
        </div>
      </div>

      {/* Floating Badges */}
      <div className="absolute top-[60%] left-[20%] border border-primary/40 bg-primary/10 px-3 py-1.5 rounded-lg backdrop-blur-md animate-pulse-glow">
        <span className="text-[10px] font-bold text-primary tracking-widest">NEARBOUND 2.0</span>
      </div>
    </div>
  )
}
