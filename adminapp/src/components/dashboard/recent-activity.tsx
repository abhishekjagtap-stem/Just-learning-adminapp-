const activity = [
  ["NK", "Neha Kapoor", "New parent consent submitted", "12 min ago", "bg-violet-100 text-violet-700"],
  ["RS", "Rohan Sharma", "Donated ₹5,000 to Education Fund", "48 min ago", "bg-sky-100 text-sky-700"],
  ["PM", "Priya Mehta", "Created a new fundraiser", "2 hr ago", "bg-amber-100 text-amber-700"],
  ["AR", "Ankit Rao", "User account verified", "4 hr ago", "bg-purple-100 text-purple-700"],
]
export function RecentActivity() { return <section className="rounded-xl border bg-card shadow-sm"><div className="flex items-center justify-between border-b px-5 py-4"><div><h2 className="font-semibold">Recent activity</h2><p className="mt-0.5 text-xs text-muted-foreground">Latest updates across your organization</p></div><button className="text-xs font-medium text-primary hover:underline">View all</button></div><div className="divide-y">{activity.map(([initials, name, description, time, color]) => <div key={name} className="flex items-center gap-3 px-5 py-3.5"><span className={`grid size-9 shrink-0 place-items-center rounded-full text-xs font-semibold ${color}`}>{initials}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{name}</p><p className="truncate text-xs text-muted-foreground">{description}</p></div><time className="shrink-0 text-xs text-muted-foreground">{time}</time></div>)}</div></section> }
