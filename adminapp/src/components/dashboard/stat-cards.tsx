import { ArrowDownRight, ArrowUpRight, Clock3, HandHeart, UsersRound, WalletCards } from "lucide-react"

const stats = [
  { label: "Total Users", value: "2,847", detail: "+12.5%", icon: UsersRound, positive: true },
  { label: "Active Funds", value: "18", detail: "+2 this month", icon: WalletCards, positive: true },
  { label: "Total Donations", value: "₹24.8L", detail: "+18.2%", icon: HandHeart, positive: true },
  { label: "Pending Consents", value: "34", detail: "Needs review", icon: Clock3, positive: false },
]

export function StatCards() { return <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{stats.map(({ label, value, detail, icon: Icon, positive }) => <article key={label} className="rounded-xl border bg-card p-5 shadow-sm"><div className="flex items-start justify-between"><p className="text-sm font-medium text-muted-foreground">{label}</p><span className="grid size-9 place-items-center rounded-lg bg-secondary text-primary"><Icon className="size-[18px]" /></span></div><p className="mt-5 text-2xl font-semibold tracking-tight">{value}</p><p className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground"><span className={positive ? "flex items-center text-primary" : "flex items-center text-amber-600"}>{positive ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}{detail}</span>{positive && " vs. last month"}</p></article>)}</section> }
