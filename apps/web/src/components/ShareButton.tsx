import type { FounderEntry } from "@foundermrr/shared";
import { formatRevenue } from "@foundermrr/shared";
import { useState } from "react";

interface Props {
  entry: FounderEntry;
}

export default function ShareButton({ entry }: Props) {
  const [copied, setCopied] = useState(false);
  const url = `https://foundermrr.com/founder/${entry.xHandle}`;
  const rev = formatRevenue(entry.totalRevenue30d);
  const tweetText = `I'm ranked #${entry.rank} on @FounderMRR with ${rev}/mo in total revenue across ${entry.startupCount} startup${entry.startupCount > 1 ? "s" : ""}!`;

  function shareOnX() {
    const encoded = encodeURIComponent(tweetText);
    const encodedUrl = encodeURIComponent(url);
    window.open(`https://x.com/intent/tweet?text=${encoded}&url=${encodedUrl}`, "_blank");
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = url;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex gap-3">
      <button onClick={shareOnX} className="px-4 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors">
        Share on X
      </button>
      <button onClick={copyLink} className="px-4 py-2.5 bg-white text-slate-600 text-sm font-medium rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
        {copied ? "Copied!" : "Copy link"}
      </button>
    </div>
  );
}
