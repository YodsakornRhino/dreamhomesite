"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import ChatWidget from "@/components/chat-widget"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuthContext } from "@/contexts/AuthContext"
import SellAuthPrompt from "@/components/sell-auth-prompt"
import { getDocuments } from "@/lib/firestore"

interface Property {
  id: string
  title: string
  price: number
  photos: string[]
}

export default function SellDashboardPage() {
  const { user, loading } = useAuthContext()
  const [properties, setProperties] = useState<Property[]>([])
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    const load = async () => {
      if (!user) return
      try {
        const docs = await getDocuments(`users/${user.uid}/user_property`)
        const props = docs.map((d) => ({ id: d.id, ...(d.data() as any) }))
        setProperties(props as Property[])
      } catch (e) {
        console.error(e)
      } finally {
        setFetching(false)
      }
    }
    load()
  }, [user])

  if (loading || fetching) return null
  if (!user) return <SellAuthPrompt />

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-bold">ประกาศขายของฉัน</h1>
        <div className="flex gap-2">
          <Link href="/sell/create">
            <Button>สร้างประกาศ</Button>
          </Link>
        </div>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>ประกาศของคุณ</CardTitle>
        </CardHeader>
        <CardContent>
          {properties.length === 0 ? (
            <p className="text-gray-500">คุณยังไม่ได้สร้างประกาศขายใดๆ</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {properties.map((p) => (
                <Link key={p.id} href={`/sell/${user.uid}/${p.id}`}>
                  <div className="border rounded-lg overflow-hidden hover:shadow cursor-pointer">
                    {p.photos && p.photos[0] && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.photos[0]}
                        alt={p.title}
                        className="h-48 w-full object-cover"
                      />
                    )}
                    <div className="p-4 space-y-1">
                      <h3 className="font-semibold">{p.title}</h3>
                      <p className="text-blue-600 font-bold">
                        {p.price?.toLocaleString("th-TH")}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      <ChatWidget />
    </div>
  )
}

