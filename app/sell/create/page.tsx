"use client"

import Link from "next/link"
import { Inter } from "next/font/google"
import ChatWidget from "@/components/chat-widget"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  Upload,
  Video,
  Camera,
  MapPin,
  TreePine,
  Building2,
  Waves,
  Shield,
  Dumbbell,
  Square,
  Wifi,
  Flame,
  LocateFixed,
} from "lucide-react"

import { useAuthContext } from "@/contexts/AuthContext"
import SellAuthPrompt from "@/components/sell-auth-prompt"

import { useEffect, useRef, useState } from "react"
import { Loader } from "@googlemaps/js-api-loader"

const inter = Inter({ subsets: ["latin"] })

const features = [
  { id: "garden", label: "Garden", icon: TreePine },
  { id: "balcony", label: "Balcony", icon: Building2 },
  { id: "pool", label: "Swimming Pool", icon: Waves },
  { id: "security", label: "Security System", icon: Shield },
  { id: "gym", label: "Gym", icon: Dumbbell },
  { id: "elevator", label: "Lift/Elevator", icon: Square },
  { id: "smart", label: "Smart Home", icon: Wifi },
  { id: "fireplace", label: "Fireplace", icon: Flame },
]

type LatLng = { lat: number | null; lng: number | null }
type Errors = Record<string, string | undefined>
type Touched = Record<string, boolean>

export default function SellCreatePage() {
  const { user, loading } = useAuthContext()

  // ====== Google Maps ======
  const [mapsReady, setMapsReady] = useState(false)
  const mapRef = useRef<HTMLDivElement | null>(null)
  const searchRef = useRef<HTMLInputElement | null>(null)
  const gmap = useRef<google.maps.Map | null>(null)
  const marker = useRef<google.maps.Marker | null>(null)
  const geocoder = useRef<google.maps.Geocoder | null>(null)
  const autocomplete = useRef<google.maps.places.Autocomplete | null>(null)

  // ====== Form states ======
  // Seller
  const [sellerName, setSellerName] = useState("")
  const [sellerPhone, setSellerPhone] = useState("")
  const [sellerEmail, setSellerEmail] = useState("")
  const [sellerRole, setSellerRole] = useState<string>("")

  // Basic
  const [title, setTitle] = useState("")
  const [propertyType, setPropertyType] = useState<string>("")
  const [transactionType, setTransactionType] = useState<string>("")
  const [price, setPrice] = useState("")

  // Location (ผูกกับแผนที่ด้านล่าง)
  const [address, setAddress] = useState("")
  const [city, setCity] = useState("")
  const [province, setProvince] = useState("")
  const [postal, setPostal] = useState("")
  const [latlng, setLatlng] = useState<LatLng>({ lat: null, lng: null })

  // Specs
  const [landArea, setLandArea] = useState("")
  const [usableArea, setUsableArea] = useState("")
  const [bedrooms, setBedrooms] = useState("")
  const [bathrooms, setBathrooms] = useState("")
  const [parking, setParking] = useState<string>("")
  const [yearBuilt, setYearBuilt] = useState("")

  // Description
  const [description, setDescription] = useState("")

  // Validation UI
  const [errors, setErrors] = useState<Errors>({})
  const [touched, setTouched] = useState<Touched>({})
  const touch = (name: string) => setTouched((t) => ({ ...t, [name]: true }))

  // ====== Helpers: validation & progress ======
  const isNonEmpty = (s: string) => s.trim().length > 0
  const isPositive = (s: string) => {
    const n = Number(s)
    return Number.isFinite(n) && n > 0
  }
  const emailOk = (s: string) => /\S+@\S+\.\S+/.test(s)
  const phoneOk = (s: string) => s.replace(/\D/g, "").length >= 6 // เบื้องต้นพอ

  const validate = (): Errors => {
    const e: Errors = {}

    // Seller
    if (!isNonEmpty(sellerName)) e.sellerName = "Required"
    if (!isNonEmpty(sellerPhone)) e.sellerPhone = "Required"
    else if (!phoneOk(sellerPhone)) e.sellerPhone = "Invalid phone number"
    if (!isNonEmpty(sellerEmail)) e.sellerEmail = "Required"
    else if (!emailOk(sellerEmail)) e.sellerEmail = "Invalid email"
    if (!isNonEmpty(sellerRole)) e.sellerRole = "Required"

    // Basic
    if (!isNonEmpty(title)) e.title = "Required"
    if (!isNonEmpty(propertyType)) e.propertyType = "Required"
    if (!isNonEmpty(transactionType)) e.transactionType = "Required"
    if (!isNonEmpty(price)) e.price = "Required"
    else if (!isPositive(price)) e.price = "Must be greater than 0"

    // Location
    if (!isNonEmpty(address)) e.address = "Required"
    if (!isNonEmpty(city)) e.city = "Required"
    if (!isNonEmpty(province)) e.province = "Required"
    if (!isNonEmpty(postal)) e.postal = "Required"

    // Specs
    if (!isNonEmpty(landArea)) e.landArea = "Required"
    else if (!isPositive(landArea)) e.landArea = "Must be greater than 0"
    if (!isNonEmpty(usableArea)) e.usableArea = "Required"
    else if (!isPositive(usableArea)) e.usableArea = "Must be greater than 0"
    if (!isNonEmpty(bedrooms)) e.bedrooms = "Required"
    else if (!isPositive(bedrooms)) e.bedrooms = "Must be greater than 0"
    if (!isNonEmpty(bathrooms)) e.bathrooms = "Required"
    else if (!isPositive(bathrooms)) e.bathrooms = "Must be greater than 0"

    // Description
    if (!isNonEmpty(description)) e.description = "Required"
    else if (description.trim().length < 50) e.description = "Minimum 50 characters"

    return e
  }

  const requiredFieldKeys = [
    "sellerName", "sellerPhone", "sellerEmail", "sellerRole",
    "title", "propertyType", "transactionType", "price",
    "address", "city", "province", "postal",
    "landArea", "usableArea", "bedrooms", "bathrooms",
    "description",
  ] as const

  // คิดเปอร์เซ็นต์จาก “จำนวนช่องที่ผ่าน validation”
  const completedCount = (() => {
    const e = validate()
    return requiredFieldKeys.length - Object.keys(e).filter(k => (e as any)[k]).length
  })()
  const totalRequired = requiredFieldKeys.length
  const progressPct = Math.round((completedCount / totalRequired) * 100)

  // ====== Google Maps: load & wire ======
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!key) return
    const loader = new Loader({ apiKey: key, version: "weekly", libraries: ["places"] })
    loader.load().then(() => setMapsReady(true)).catch(() => setMapsReady(false))
  }, [])

  useEffect(() => {
    if (!mapsReady || !mapRef.current) return
    const start = { lat: 13.7563, lng: 100.5018 } // Bangkok default

    gmap.current = new google.maps.Map(mapRef.current, {
      center: start, zoom: 12,
      mapTypeControl: false, streetViewControl: false, fullscreenControl: true,
    })
    marker.current = new google.maps.Marker({ map: gmap.current, position: start, draggable: true })
    geocoder.current = new google.maps.Geocoder()

    gmap.current.addListener("click", (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return
      placeMarkerAndFill(e.latLng)
    })
    marker.current.addListener("dragend", () => {
      const pos = marker.current!.getPosition()
      if (pos) placeMarkerAndFill(pos)
    })

    if (searchRef.current) {
      autocomplete.current = new google.maps.places.Autocomplete(searchRef.current, {
        fields: ["geometry", "address_components", "formatted_address"],
        types: ["geocode"],
      })
      autocomplete.current.bindTo("bounds", gmap.current)
      autocomplete.current.addListener("place_changed", () => {
        const place = autocomplete.current!.getPlace()
        if (!place.geometry || !place.geometry.location) return
        const loc = place.geometry.location
        gmap.current!.panTo(loc); gmap.current!.setZoom(16)
        marker.current!.setPosition(loc)
        setLatlng({ lat: loc.lat(), lng: loc.lng() })
        fillAddressFromComponents(place.address_components ?? [], place.formatted_address)
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapsReady])

  const centerOnUser = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser")
      return
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        if (!gmap.current) return
        const loc = new google.maps.LatLng(coords.latitude, coords.longitude)
        gmap.current.setZoom(16)
        placeMarkerAndFill(loc)
      },
      () => alert("Unable to retrieve your location")
    )
  }

  const placeMarkerAndFill = (pos: google.maps.LatLng) => {
    marker.current!.setPosition(pos)
    gmap.current!.panTo(pos)
    setLatlng({ lat: pos.lat(), lng: pos.lng() })
    if (!geocoder.current) return
    geocoder.current.geocode({ location: pos }, (results, status) => {
      if (status === "OK" && results && results[0]) {
        fillAddressFromComponents(results[0].address_components ?? [], results[0].formatted_address)
        if (searchRef.current) searchRef.current.value = results[0].formatted_address ?? ""
      }
    })
  }

  const fillAddressFromComponents = (
    components: google.maps.GeocoderAddressComponent[],
    formatted?: string
  ) => {
    const get = (type: string) => components.find(c => c.types.includes(type))?.long_name ?? ""
    const streetNumber = get("street_number")
    const route = get("route")
    const sublocality = get("sublocality") || get("sublocality_level_1")
    const locality = get("locality") || get("administrative_area_level_2")
    const admin1 = get("administrative_area_level_1")
    const zip = get("postal_code")

    const addr = [streetNumber, route].filter(Boolean).join(" ")
      || [route, sublocality].filter(Boolean).join(", ")
      || formatted || ""

    setAddress(addr); touch("address")
    setCity(locality || sublocality || ""); touch("city")
    setProvince(admin1 || ""); touch("province")
    setPostal(zip || ""); touch("postal")
  }

  // ====== Submit ======
  const handleSubmit = () => {
    const e = validate()
    setErrors(e)
    // mark all as touched toโชว์ error
    const t: Touched = {}
    requiredFieldKeys.forEach((k) => (t[k] = true))
    setTouched((old) => ({ ...old, ...t }))

    const firstErrorKey = requiredFieldKeys.find((k) => e[k])
    if (firstErrorKey) {
      const el = document.getElementById(firstErrorKey)
      if (el?.scrollIntoView) el.scrollIntoView({ behavior: "smooth", block: "center" })
      return
    }
    // TODO: ส่งข้อมูลไปบันทึก
    alert("All good! Ready to submit.")
  }

  // convenience: แสดงข้อความผิดพลาดเมื่อ touched + error
  const showErr = (key: string) => touched[key] && errors[key]
  const inputErrClass = (key: string) => (showErr(key) ? "border-red-500 focus-visible:ring-red-500" : "")

  if (loading) return null
  if (!user) return <SellAuthPrompt />

  return (
    <div className={`${inter.className} bg-gray-50 min-h-screen`}>
      <div className="max-w-4xl mx-auto p-4 sm:p-8 space-y-8">
        <header className="space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Post Your Property for Sale</h1>
            <Link href="/sell">
              <Button variant="outline">Back to My Posts</Button>
            </Link>
          </div>

          {/* Progress dynamic */}
          <div>
            <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
              <span>Progress</span>
              <span>{progressPct}% Complete</span>
            </div>
            <div className="w-full bg-gray-200 h-2 rounded-full">
              <div
                className="h-2 bg-purple-600 rounded-full transition-[width] duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </header>

        {/* Seller Information */}
        <Card>
          <CardHeader><CardTitle>Seller Information</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="sellerName">Full Name*</Label>
              <Input
                id="sellerName"
                value={sellerName}
                onChange={(e) => setSellerName(e.target.value)}
                onBlur={() => touch("sellerName")}
                className={inputErrClass("sellerName")}
                placeholder="Enter your full name"
                aria-invalid={!!showErr("sellerName")}
              />
              {showErr("sellerName") && <p className="text-xs text-red-600 mt-1">{errors.sellerName}</p>}
            </div>
            <div>
              <Label htmlFor="sellerPhone">Phone Number*</Label>
              <Input
                id="sellerPhone"
                value={sellerPhone}
                onChange={(e) => setSellerPhone(e.target.value)}
                onBlur={() => touch("sellerPhone")}
                className={inputErrClass("sellerPhone")}
                placeholder="+1 (555) 123-4567"
                aria-invalid={!!showErr("sellerPhone")}
              />
              {showErr("sellerPhone") && <p className="text-xs text-red-600 mt-1">{errors.sellerPhone}</p>}
            </div>
            <div>
              <Label htmlFor="sellerEmail">Email Address*</Label>
              <Input
                id="sellerEmail"
                value={sellerEmail}
                onChange={(e) => setSellerEmail(e.target.value)}
                onBlur={() => touch("sellerEmail")}
                className={inputErrClass("sellerEmail")}
                placeholder="you@example.com"
                aria-invalid={!!showErr("sellerEmail")}
              />
              {showErr("sellerEmail") && <p className="text-xs text-red-600 mt-1">{errors.sellerEmail}</p>}
            </div>
            <div>
              <Label htmlFor="sellerRole">Role*</Label>
              <Select
                value={sellerRole}
                onValueChange={(v) => { setSellerRole(v); touch("sellerRole") }}
              >
                <SelectTrigger id="sellerRole" className={inputErrClass("sellerRole")}>
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="owner">Owner</SelectItem>
                  <SelectItem value="agent">Agent</SelectItem>
                </SelectContent>
              </Select>
              {showErr("sellerRole") && <p className="text-xs text-red-600 mt-1">{errors.sellerRole}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Property Basic Details */}
        <Card>
          <CardHeader><CardTitle>Property Basic Details</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="title">Property Title*</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => touch("title")}
                className={inputErrClass("title")}
                placeholder="e.g., Modern 2 Storey House in City Center"
                aria-invalid={!!showErr("title")}
              />
              {showErr("title") && <p className="text-xs text-red-600 mt-1">{errors.title}</p>}
            </div>
            <div>
              <Label htmlFor="propertyType">Property Type*</Label>
              <Select
                value={propertyType}
                onValueChange={(v) => { setPropertyType(v); touch("propertyType") }}
              >
                <SelectTrigger id="propertyType" className={inputErrClass("propertyType")}>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="house">House</SelectItem>
                  <SelectItem value="condo">Condo</SelectItem>
                  <SelectItem value="land">Land</SelectItem>
                </SelectContent>
              </Select>
              {showErr("propertyType") && <p className="text-xs text-red-600 mt-1">{errors.propertyType}</p>}
            </div>
            <div>
              <Label htmlFor="transactionType">Transaction Type*</Label>
              <Select
                value={transactionType}
                onValueChange={(v) => { setTransactionType(v); touch("transactionType") }}
              >
                <SelectTrigger id="transactionType" className={inputErrClass("transactionType")}>
                  <SelectValue placeholder="Select transaction" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sale">Sale</SelectItem>
                  <SelectItem value="rent">Rent</SelectItem>
                </SelectContent>
              </Select>
              {showErr("transactionType") && <p className="text-xs text-red-600 mt-1">{errors.transactionType}</p>}
            </div>
            <div>
              <Label htmlFor="price">Price*</Label>
              <Input
                id="price"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                onBlur={() => touch("price")}
                className={inputErrClass("price")}
                placeholder="$ 750,000"
                aria-invalid={!!showErr("price")}
              />
              {showErr("price") && <p className="text-xs text-red-600 mt-1">{errors.price}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Property Location */}
        <Card>
          <CardHeader><CardTitle>Property Location</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="map-search">Search on map</Label>
              <div className="flex gap-2">
                <Input
                  id="map-search"
                  ref={searchRef}
                  placeholder="Search address, condo, landmark…"
                  className="flex-1"
                />
                <Button type="button" variant="outline" onClick={centerOnUser}>
                  <LocateFixed className="mr-2 h-4 w-4" />
                  Use my location
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                เลือกจากรายการแนะนำ หรือคลิก/ลากหมุดบนแผนที่เพื่อกำหนดตำแหน่ง
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="address">Address*</Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  onBlur={() => touch("address")}
                  className={inputErrClass("address")}
                  placeholder="123 Oak Street"
                  aria-invalid={!!showErr("address")}
                />
                {showErr("address") && <p className="text-xs text-red-600 mt-1">{errors.address}</p>}
              </div>
              <div>
                <Label htmlFor="city">City*</Label>
                <Input
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  onBlur={() => touch("city")}
                  className={inputErrClass("city")}
                  placeholder="Metro City"
                  aria-invalid={!!showErr("city")}
                />
                {showErr("city") && <p className="text-xs text-red-600 mt-1">{errors.city}</p>}
              </div>
              <div>
                <Label htmlFor="province">Province/State*</Label>
                <Input
                  id="province"
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  onBlur={() => touch("province")}
                  className={inputErrClass("province")}
                  placeholder="California"
                  aria-invalid={!!showErr("province")}
                />
                {showErr("province") && <p className="text-xs text-red-600 mt-1">{errors.province}</p>}
              </div>
              <div>
                <Label htmlFor="postal">Postal Code*</Label>
                <Input
                  id="postal"
                  value={postal}
                  onChange={(e) => setPostal(e.target.value)}
                  onBlur={() => touch("postal")}
                  className={inputErrClass("postal")}
                  placeholder="90210"
                  aria-invalid={!!showErr("postal")}
                />
                {showErr("postal") && <p className="text-xs text-red-600 mt-1">{errors.postal}</p>}
              </div>
            </div>

            <div className="rounded-lg border overflow-hidden">
              <div ref={mapRef} className="h-72 w-full" />
              {!mapsReady && (
                <div className="h-72 w-full flex flex-col items-center justify-center text-gray-500">
                  <MapPin className="h-6 w-6 mb-2" />
                  <p className="text-sm">Loading map…</p>
                  <p className="text-xs">ตรวจ API key และ internet</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="lat">Latitude</Label>
                <Input id="lat" value={latlng.lat ?? ""} readOnly />
              </div>
              <div>
                <Label htmlFor="lng">Longitude</Label>
                <Input id="lng" value={latlng.lng ?? ""} readOnly />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Property Specifications */}
        <Card>
          <CardHeader><CardTitle>Property Specifications</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="landArea">Land Area*</Label>
              <Input
                id="landArea"
                value={landArea}
                onChange={(e) => setLandArea(e.target.value)}
                onBlur={() => touch("landArea")}
                className={inputErrClass("landArea")}
                placeholder="2400"
                aria-invalid={!!showErr("landArea")}
              />
              {showErr("landArea") && <p className="text-xs text-red-600 mt-1">{errors.landArea}</p>}
            </div>
            <div>
              <Label htmlFor="usableArea">Usable Area*</Label>
              <Input
                id="usableArea"
                value={usableArea}
                onChange={(e) => setUsableArea(e.target.value)}
                onBlur={() => touch("usableArea")}
                className={inputErrClass("usableArea")}
                placeholder="1800"
                aria-invalid={!!showErr("usableArea")}
              />
              {showErr("usableArea") && <p className="text-xs text-red-600 mt-1">{errors.usableArea}</p>}
            </div>
            <div>
              <Label htmlFor="bedrooms">Bedrooms*</Label>
              <Input
                id="bedrooms"
                value={bedrooms}
                onChange={(e) => setBedrooms(e.target.value)}
                onBlur={() => touch("bedrooms")}
                className={inputErrClass("bedrooms")}
                placeholder="3"
                aria-invalid={!!showErr("bedrooms")}
              />
              {showErr("bedrooms") && <p className="text-xs text-red-600 mt-1">{errors.bedrooms}</p>}
            </div>
            <div>
              <Label htmlFor="bathrooms">Bathrooms*</Label>
              <Input
                id="bathrooms"
                value={bathrooms}
                onChange={(e) => setBathrooms(e.target.value)}
                onBlur={() => touch("bathrooms")}
                className={inputErrClass("bathrooms")}
                placeholder="2"
                aria-invalid={!!showErr("bathrooms")}
              />
              {showErr("bathrooms") && <p className="text-xs text-red-600 mt-1">{errors.bathrooms}</p>}
            </div>
            <div>
              <Label htmlFor="parking">Parking Spaces</Label>
              <Select value={parking} onValueChange={(v) => setParking(v)}>
                <SelectTrigger id="parking">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="1">1</SelectItem>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="3">3</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="yearBuilt">Year Built</Label>
              <Input
                id="yearBuilt"
                value={yearBuilt}
                onChange={(e) => setYearBuilt(e.target.value)}
                placeholder="2020"
              />
            </div>
          </CardContent>
        </Card>

        {/* Property Description */}
        <Card>
          <CardHeader><CardTitle>Property Description</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <Label htmlFor="description">Describe your property*</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={() => touch("description")}
              className={inputErrClass("description")}
              placeholder="Describe the highlights, condition, and unique selling points of your property..."
              rows={5}
              aria-invalid={!!showErr("description")}
            />
            {showErr("description") && <p className="text-xs text-red-600">{errors.description}</p>}
            <p className="text-xs text-gray-500">Minimum 50 characters. Be descriptive to attract more buyers.</p>
          </CardContent>
        </Card>

        {/* Property Photos */}
        <Card>
          <CardHeader><CardTitle>Property Photos (Max 20 photos)</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <Camera className="mx-auto h-10 w-10 text-gray-400 mb-4" />
              <p className="text-sm text-gray-500 mb-4">Drag and drop photos here</p>
              <Button><Upload className="mr-2 h-4 w-4" />Choose Photos</Button>
              <p className="text-xs text-gray-500 mt-4">Supported formats: JPG, PNG, GIF. Max size 10MB each.</p>
            </div>
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <Video className="mx-auto h-10 w-10 text-gray-400 mb-4" />
              <p className="text-sm text-gray-500 mb-4">Upload a video or virtual tour</p>
              <Button variant="outline"><Upload className="mr-2 h-4 w-4" />Choose Video</Button>
              <p className="text-xs text-gray-500 mt-4">Max 100MB. MP4, MOV formats.</p>
            </div>
          </CardContent>
        </Card>

        {/* Additional Options */}
        <Card>
          <CardHeader><CardTitle>Additional Options</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-2">
                <Checkbox id="mortgage" />
                <div className="space-y-1">
                  <Label htmlFor="mortgage" className="font-medium">Include Mortgage Calculator</Label>
                  <p className="text-sm text-gray-500">Help buyers estimate monthly payments</p>
                </div>
              </div>
              <span className="text-sm text-gray-500">Free</span>
            </div>
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-2">
                <Checkbox id="featured" />
                <div className="space-y-1">
                  <Label htmlFor="featured" className="font-medium">Featured Listing</Label>
                  <p className="text-sm text-gray-500">Stand out with premium placement</p>
                </div>
              </div>
              <span className="text-sm text-gray-500">$25/month</span>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-end">
          <Button variant="outline">Preview Listing</Button>
          <Button variant="secondary">Save Draft</Button>
          <Button onClick={handleSubmit} className="bg-purple-600 text-white hover:bg-purple-700">
            Post Property
          </Button>
        </div>
      </div>
      <ChatWidget />
    </div>
  )
}
