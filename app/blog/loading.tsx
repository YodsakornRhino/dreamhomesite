import { Loader2 } from "lucide-react"

export default function Loading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center text-slate-500">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p>กำลังโหลดบทความ...</p>
      </div>
    </div>
  )
}
