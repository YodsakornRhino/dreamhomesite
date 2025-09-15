"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import ChatWidget from "@/components/chat-widget"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuthContext } from "@/contexts/AuthContext"
import SellAuthPrompt from "@/components/sell-auth-prompt"
import { getDocuments } from "@/lib/firestore"

export default function SellDashboardPage() {
  const { user, loading } = useAuthContext()
  const [properties, setProperties] = useState<any[]>([])

  useEffect(() => {
    if (!user) return
    const fetch = async () => {
      try {
        const docs = await getDocuments(`users/${user.uid}/user_property`)
        const data = docs.map((d) => ({ id: d.id, ...d.data() }))
        setProperties(data)
      } catch (err) {
        console.error(err)
      }
    }
    fetch()
  }, [user])

  if (loading) return null
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

      {properties.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>ประกาศของคุณ</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500">คุณยังไม่ได้สร้างประกาศขายใดๆ</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {properties.map((property) => (
            <Card key={property.id}>
              <CardHeader>
                <CardTitle>{property.title || "(ไม่มีชื่อ)"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Array.isArray(property.photos) && property.photos.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {property.photos.map((url: string, idx: number) => (
                      <img
                        key={idx}
                        src={url}
                        alt={property.title || `photo-${idx}`}
                        className="w-full h-32 object-cover rounded"
                      />
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <Link href={`/sell/${user.uid}/${property.id}`}>
                    <Button variant="outline">ดูรายละเอียด</Button>
                  </Link>
                  <Link href={`/sell/${user.uid}/${property.id}/edit`}>
                    <Button>แก้ไข</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ChatWidget />
    </div>
  )
}

