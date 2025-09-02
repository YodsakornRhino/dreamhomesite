"use client"

import Link from "next/link"
import ChatWidget from "@/components/chat-widget"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuthContext } from "@/contexts/AuthContext"
import SellAuthPrompt from "@/components/sell-auth-prompt"

export default function SellDashboardPage() {
  const { user, loading } = useAuthContext()

  if (loading) return null
  if (!user) return <SellAuthPrompt />

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-bold">My Sell Posts</h1>
        <div className="flex gap-2">
          <Link href="/sell/create">
            <Button>Create Post</Button>
          </Link>
          <Link href="/sell/all">
            <Button variant="outline">View All Posts</Button>
          </Link>
        </div>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Your Posts</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">You haven't created any sell posts yet.</p>
        </CardContent>
      </Card>
      <ChatWidget />
    </div>
  )
}

