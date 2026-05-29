export function Footer() {
  return (
    <>
      {/* Developer name above the icons */}
      <div
        style={{ fontFamily: "'Noto Sans', sans-serif" }}
        className="fixed bottom-12 w-full flex justify-center z-50 pointer-events-none"
      >
        <span className="text-primary/80 text-sm font-semibold tracking-widest select-none">
          𓆩𓅓𝑺𝑨𝑸𝑬𝑹𓅓𓆪
        </span>
      </div>

      {/* Support icons bar */}
      <div className="fixed bottom-0 left-0 w-full flex justify-center items-center gap-5 py-2 z-50 bg-background/80 backdrop-blur-sm border-t border-border/50">
        {/* Gmail */}
        <a
          href="mailto:hackservervip1@gmail.com"
          target="_blank"
          rel="noopener noreferrer"
          title="Gmail"
          className="opacity-90 hover:opacity-100 hover:scale-110 transition-all duration-200"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-8 h-8 sm:w-9 sm:h-9">
            <path fill="#EA4335" d="M6 40h6V22L4 16v20a4 4 0 0 0 4 4z"/>
            <path fill="#34A853" d="M36 40h6a4 4 0 0 0 4-4V16l-10 6z"/>
            <path fill="#4A90D9" d="M36 8H12L24 17z"/>
            <path fill="#FBBC05" d="M12 22v18h24V22L24 31z"/>
            <path fill="#EA4335" d="M4 16l10 6 10-9-10-5z"/>
            <path fill="#34A853" d="M44 16 34 22 24 13l10-5z"/>
          </svg>
        </a>

        {/* Telegram */}
        <a
          href="https://t.me/OX_U1"
          target="_blank"
          rel="noopener noreferrer"
          title="Telegram"
          className="opacity-90 hover:opacity-100 hover:scale-110 transition-all duration-200"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-8 h-8 sm:w-9 sm:h-9">
            <circle cx="24" cy="24" r="22" fill="#29B6F6"/>
            <path fill="#fff" d="M33.95 15.02 10.2 23.72c-1.03.41-.97 1.84.09 2.18l5.9 1.84 2.28 7.07c.28.87 1.38 1.14 2.01.5l3.28-3.27 6.44 4.75c.87.64 2.1.17 2.32-.88l4.01-19.25c.27-1.27-.97-2.27-2.18-1.64zM19.62 28.9l-.59 4.04-1.73-5.36 13.45-8.55z"/>
          </svg>
        </a>
      </div>
    </>
  );
}
