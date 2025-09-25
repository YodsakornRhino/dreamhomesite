"use client"

import { SellPropertyForm } from "@/components/sell-property-form"

interface SellEditPageProps {
  params: {
    id: string
  }
}

export default function SellEditPage({ params }: SellEditPageProps) {
  return <SellPropertyForm mode="edit" propertyId={params.id} />
}
