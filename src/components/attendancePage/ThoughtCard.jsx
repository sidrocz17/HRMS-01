// src/components/attendance/ThoughtCard.jsx

const THOUGHTS = [
  { quote: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { quote: "Hard work beats talent when talent doesn't work hard.", author: "Tim Notke" },
  { quote: "Success is the sum of small efforts repeated day in and day out.", author: "Robert Collier" },
  { quote: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { quote: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { quote: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { quote: "Push yourself, because no one else is going to do it for you.", author: "Unknown" },
];

// Pick a thought deterministically by day-of-year so it's stable on reload
const getDailyThought = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now - start;
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);
  return THOUGHTS[dayOfYear % THOUGHTS.length];
};

export default function ThoughtCard() {
  const thought = getDailyThought();

  return (
    <div className="bg-[#1a2240] rounded-2xl px-6 py-4 flex items-center gap-4 shadow-sm">
      {/* Icon */}
      <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
        <svg className="w-5 h-5 text-[#f5a623]" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
            clipRule="evenodd" />
        </svg>
      </div>

      {/* Text */}
      <div className="min-w-0">
        <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-0.5">
          Thought of the Day
        </p>
        <p className="text-sm font-medium text-white leading-snug">
          "{thought.quote}"
        </p>
        <p className="text-xs text-white/50 mt-0.5">— {thought.author}</p>
      </div>
    </div>
  );
}
