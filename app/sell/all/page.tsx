import Link from "next/link"
import ChatWidget from "@/components/chat-widget"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function SellAllPostsPage() {
  return (
    <div className="max-w-4xl mx-auto p-4 space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-bold">All Sell Posts</h1>
        <Link href="/sell">
          <Button variant="outline">Back to My Posts</Button>
        </Link>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>All Posts</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">All sell posts will be displayed here.</p>
        </CardContent>
      </Card>
      <ChatWidget />
    </div>
  )
}

