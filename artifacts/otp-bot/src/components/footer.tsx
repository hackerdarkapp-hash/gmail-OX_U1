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
        <a
          href="mailto:hackservervip1@gmail.com"
          target="_blank"
          rel="noopener noreferrer"
          title="Gmail"
          className="opacity-70 hover:opacity-100 transition-opacity"
        >
          <img
            src="https://cdn-icons-png.flaticon.com/512/732/732200.png"
            alt="Gmail"
            className="w-7 h-7 sm:w-8 sm:h-8"
          />
        </a>
        <a
          href="https://t.me/OX_U1"
          target="_blank"
          rel="noopener noreferrer"
          title="Telegram"
          className="opacity-70 hover:opacity-100 transition-opacity"
        >
          <img
            src="https://cdn-icons-png.flaticon.com/512/2111/2111646.png"
            alt="Telegram"
            className="w-7 h-7 sm:w-8 sm:h-8"
          />
        </a>
      </div>
    </>
  );
}
