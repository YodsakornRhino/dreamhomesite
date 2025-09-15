"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import ChatWidget from "@/components/chat-widget"
import { Button } from "@/components/ui/button"
import { useAuthContext } from "@/contexts/AuthContext"
import SellAuthPrompt from "@/components/sell-auth-prompt"
import { getDocuments } from "@/lib/firestore"
import UserPropertyCard from "@/components/user-property-card"

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
        <p className="text-gray-500">คุณยังไม่ได้สร้างประกาศขายใดๆ</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {properties.map((property) => (
            <UserPropertyCard
              key={property.id}
              property={property}
              ownerUid={user.uid}
            />
          ))}
        </div>
      )}

      <ChatWidget />
    </div>
  )
}

