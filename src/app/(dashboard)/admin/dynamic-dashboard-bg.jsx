export function DynamicDashboardBackground() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none -z-10 overflow-hidden select-none"
    >
      <div className="absolute -inset-[25%] opacity-85 dark:opacity-45">
        {/* Muted Red / Coral Aura (drifts top-left to center-left) */}
        <div
          className="absolute top-[8%] left-[10%] w-[52vw] h-[52vw] min-w-[360px] min-h-[360px] rounded-full blur-[100px] sm:blur-[140px] animate-ambient-red"
          style={{
            background:
              "radial-gradient(circle, rgba(231, 111, 81, 0.16) 0%, rgba(231, 111, 81, 0.05) 55%, transparent 75%)",
          }}
        />

        {/* Muted Yellow / Amber Aura (drifts top-right to bottom-right) */}
        <div
          className="absolute top-[18%] right-[8%] w-[58vw] h-[58vw] min-w-[400px] min-h-[400px] rounded-full blur-[110px] sm:blur-[150px] animate-ambient-yellow"
          style={{
            background:
              "radial-gradient(circle, rgba(233, 196, 106, 0.22) 0%, rgba(233, 196, 106, 0.06) 55%, transparent 75%)",
          }}
        />

        {/* Muted Green / Sage Aura (drifts bottom-left to bottom-center) */}
        <div
          className="absolute bottom-[8%] left-[14%] w-[55vw] h-[55vw] min-w-[380px] min-h-[380px] rounded-full blur-[110px] sm:blur-[150px] animate-ambient-green"
          style={{
            background:
              "radial-gradient(circle, rgba(42, 157, 143, 0.18) 0%, rgba(42, 157, 143, 0.05) 55%, transparent 75%)",
          }}
        />

        {/* Muted Warm Accent / Blend (drifts across bottom-right) */}
        <div
          className="absolute bottom-[16%] right-[14%] w-[46vw] h-[46vw] min-w-[320px] min-h-[320px] rounded-full blur-[100px] sm:blur-[140px] animate-ambient-blend"
          style={{
            background:
              "radial-gradient(circle, rgba(233, 196, 106, 0.14) 0%, rgba(231, 111, 81, 0.07) 40%, rgba(42, 157, 143, 0.05) 70%, transparent 85%)",
          }}
        />
      </div>

      <style>{`
        @keyframes ambient-drift-red {
          0% {
            transform: translate3d(0, 0, 0) scale(1);
          }
          50% {
            transform: translate3d(10vw, 12vh, 0) scale(1.14);
          }
          100% {
            transform: translate3d(5vw, 20vh, 0) scale(0.96);
          }
        }

        @keyframes ambient-drift-yellow {
          0% {
            transform: translate3d(0, 0, 0) scale(1);
          }
          50% {
            transform: translate3d(-12vw, 10vh, 0) scale(1.12);
          }
          100% {
            transform: translate3d(-6vw, -8vh, 0) scale(1.04);
          }
        }

        @keyframes ambient-drift-green {
          0% {
            transform: translate3d(0, 0, 0) scale(1);
          }
          50% {
            transform: translate3d(12vw, -10vh, 0) scale(1.1);
          }
          100% {
            transform: translate3d(-8vw, -6vh, 0) scale(0.94);
          }
        }

        @keyframes ambient-drift-blend {
          0% {
            transform: translate3d(0, 0, 0) scale(1) rotate(0deg);
          }
          50% {
            transform: translate3d(-8vw, -12vh, 0) scale(1.15) rotate(12deg);
          }
          100% {
            transform: translate3d(7vw, 8vh, 0) scale(0.92) rotate(-8deg);
          }
        }

        .animate-ambient-red {
          animation: ambient-drift-red 24s ease-in-out infinite alternate;
          will-change: transform;
        }

        .animate-ambient-yellow {
          animation: ambient-drift-yellow 28s ease-in-out infinite alternate;
          will-change: transform;
        }

        .animate-ambient-green {
          animation: ambient-drift-green 26s ease-in-out infinite alternate;
          will-change: transform;
        }

        .animate-ambient-blend {
          animation: ambient-drift-blend 32s ease-in-out infinite alternate;
          will-change: transform;
        }

        @media (prefers-reduced-motion: reduce) {
          .animate-ambient-red,
          .animate-ambient-yellow,
          .animate-ambient-green,
          .animate-ambient-blend {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  )
}
