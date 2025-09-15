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

import { useEffect, useRef, useState, type ChangeEvent } from "react"
import { Loader } from "@googlemaps/js-api-loader"
import { uploadFile, uploadFiles, getDownloadURL } from "@/lib/storage"
import { setDocument } from "@/lib/firestore"

const inter = Inter({ subsets: ["latin"] })

const features = [
  { id: "garden", label: "สวน", icon: TreePine },
  { id: "balcony", label: "ระเบียง", icon: Building2 },
  { id: "pool", label: "สระว่ายน้ำ", icon: Waves },
  { id: "security", label: "ระบบรักษาความปลอดภัย", icon: Shield },
  { id: "gym", label: "ฟิตเนส", icon: Dumbbell },
  { id: "elevator", label: "ลิฟต์", icon: Square },
  { id: "smart", label: "สมาร์ทโฮม", icon: Wifi },
  { id: "fireplace", label: "เตาผิง", icon: Flame },
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
  const photoInputRef = useRef<HTMLInputElement | null>(null)
  const videoInputRef = useRef<HTMLInputElement | null>(null)

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

  // Media
  const [photos, setPhotos] = useState<File[]>([])
  const [video, setVideo] = useState<File | null>(null)
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([])
  const [videoPreview, setVideoPreview] = useState<string | null>(null)

  // Validation UI
  const [errors, setErrors] = useState<Errors>({})
  const [touched, setTouched] = useState<Touched>({})
  const touch = (name: string) => setTouched((t) => ({ ...t, [name]: true }))

  const handlePhotosChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    setPhotos((prev) => {
      const merged = [...prev, ...files]
      return merged.slice(0, 50)
    })
  }

  const handleVideoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setVideo(file)
  }

  useEffect(() => {
    const urls = photos.map((file) => URL.createObjectURL(file))
    setPhotoPreviews(urls)
    return () => urls.forEach((url) => URL.revokeObjectURL(url))
  }, [photos])

  useEffect(() => {
    if (!video) {
      setVideoPreview(null)
      return
    }
    const url = URL.createObjectURL(video)
    setVideoPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [video])

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
    if (!isNonEmpty(sellerName)) e.sellerName = "จำเป็น"
    if (!isNonEmpty(sellerPhone)) e.sellerPhone = "จำเป็น"
    else if (!phoneOk(sellerPhone)) e.sellerPhone = "เบอร์โทรไม่ถูกต้อง"
    if (!isNonEmpty(sellerEmail)) e.sellerEmail = "จำเป็น"
    else if (!emailOk(sellerEmail)) e.sellerEmail = "อีเมลไม่ถูกต้อง"
    if (!isNonEmpty(sellerRole)) e.sellerRole = "จำเป็น"

    // Basic
    if (!isNonEmpty(title)) e.title = "จำเป็น"
    if (!isNonEmpty(propertyType)) e.propertyType = "จำเป็น"
    if (!isNonEmpty(transactionType)) e.transactionType = "จำเป็น"
    if (!isNonEmpty(price)) e.price = "จำเป็น"
    else if (!isPositive(price)) e.price = "ต้องมากกว่า 0"

    // Location
    if (!isNonEmpty(address)) e.address = "จำเป็น"
    if (!isNonEmpty(city)) e.city = "จำเป็น"
    if (!isNonEmpty(province)) e.province = "จำเป็น"
    if (!isNonEmpty(postal)) e.postal = "จำเป็น"

    // Specs
    if (!isNonEmpty(landArea)) e.landArea = "จำเป็น"
    else if (!isPositive(landArea)) e.landArea = "ต้องมากกว่า 0"
    if (!isNonEmpty(usableArea)) e.usableArea = "จำเป็น"
    else if (!isPositive(usableArea)) e.usableArea = "ต้องมากกว่า 0"
    if (!isNonEmpty(bedrooms)) e.bedrooms = "จำเป็น"
    else if (!isPositive(bedrooms)) e.bedrooms = "ต้องมากกว่า 0"
    if (!isNonEmpty(bathrooms)) e.bathrooms = "จำเป็น"
    else if (!isPositive(bathrooms)) e.bathrooms = "ต้องมากกว่า 0"

    // Description
    if (!isNonEmpty(description)) e.description = "จำเป็น"
    else if (description.trim().length < 50) e.description = "ขั้นต่ำ 50 ตัวอักษร"

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
      alert("เบราว์เซอร์ของคุณไม่รองรับการระบุตำแหน่ง")
      return
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        if (!gmap.current) return
        const loc = new google.maps.LatLng(coords.latitude, coords.longitude)
        gmap.current.setZoom(16)
        placeMarkerAndFill(loc)
      },
      () => console.error("ไม่สามารถรับตำแหน่งของคุณได้")
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
  const handleSubmit = async () => {
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

    if (!user) return

    try {
      const propertyId = crypto.randomUUID()

      const imageData = photos.map((file, idx) => ({
        path: `users/${user.uid}/property/${propertyId}/images/${idx}-${file.name}`,
        file,
      }))
      await uploadFiles(imageData)
      const photoUrls = await Promise.all(
        imageData.map(({ path }) => getDownloadURL(path))
      )

      let videoUrl: string | null = null
      if (video) {
        const videoPath = `users/${user.uid}/property/${propertyId}/videos/${video.name}`
        await uploadFile(videoPath, video)
        videoUrl = await getDownloadURL(videoPath)
      }

      await setDocument(`users/${user.uid}/user_property`, propertyId, {
        sellerName,
        sellerPhone,
        sellerEmail,
        sellerRole,
        title,
        propertyType,
        transactionType,
        price: Number(price),
        address,
        city,
        province,
        postal,
        lat: latlng.lat,
        lng: latlng.lng,
        landArea,
        usableArea,
        bedrooms,
        bathrooms,
        parking,
        yearBuilt,
        description,
        photos: photoUrls,
        video: videoUrl,
        createdAt: new Date().toISOString(),
      })

      alert("บันทึกเรียบร้อย!")
    } catch (err) {
      console.error(err)
      alert("เกิดข้อผิดพลาดในการบันทึก")
    }
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
            <h1 className="text-3xl font-bold">ลงประกาศขายอสังหาของคุณ</h1>
            <Link href="/sell">
              <Button variant="outline">กลับไปประกาศของฉัน</Button>
            </Link>
          </div>

          {/* Progress dynamic */}
          <div>
            <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
              <span>ความคืบหน้า</span>
              <span>{progressPct}% เสร็จสิ้น</span>
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
          <CardHeader><CardTitle>ข้อมูลผู้ขาย</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="sellerName">ชื่อ-นามสกุล*</Label>
              <Input
                id="sellerName"
                value={sellerName}
                onChange={(e) => setSellerName(e.target.value)}
                onBlur={() => touch("sellerName")}
                className={inputErrClass("sellerName")}
                placeholder="กรอกชื่อ-นามสกุล"
                aria-invalid={!!showErr("sellerName")}
              />
              {showErr("sellerName") && <p className="text-xs text-red-600 mt-1">{errors.sellerName}</p>}
            </div>
            <div>
              <Label htmlFor="sellerPhone">เบอร์โทร*</Label>
              <Input
                id="sellerPhone"
                value={sellerPhone}
                onChange={(e) => setSellerPhone(e.target.value)}
                onBlur={() => touch("sellerPhone")}
                className={inputErrClass("sellerPhone")}
                placeholder="081 234 5678"
                aria-invalid={!!showErr("sellerPhone")}
              />
              {showErr("sellerPhone") && <p className="text-xs text-red-600 mt-1">{errors.sellerPhone}</p>}
            </div>
            <div>
              <Label htmlFor="sellerEmail">อีเมล*</Label>
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
              <Label htmlFor="sellerRole">บทบาท*</Label>
              <Select
                value={sellerRole}
                onValueChange={(v) => { setSellerRole(v); touch("sellerRole") }}
              >
                <SelectTrigger id="sellerRole" className={inputErrClass("sellerRole")}> 
                  <SelectValue placeholder="เลือกบทบาทของคุณ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="owner">เจ้าของ</SelectItem>
                  <SelectItem value="agent">นายหน้า</SelectItem>
                </SelectContent>
              </Select>
              {showErr("sellerRole") && <p className="text-xs text-red-600 mt-1">{errors.sellerRole}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Property Basic Details */}
        <Card>
          <CardHeader><CardTitle>รายละเอียดพื้นฐานของทรัพย์</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="title">ชื่อประกาศ*</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => touch("title")}
                className={inputErrClass("title")}
                placeholder="เช่น บ้านสองชั้นสมัยใหม่ใจกลางเมือง"
                aria-invalid={!!showErr("title")}
              />
              {showErr("title") && <p className="text-xs text-red-600 mt-1">{errors.title}</p>}
            </div>
            <div>
              <Label htmlFor="propertyType">ประเภททรัพย์สิน*</Label>
              <Select
                value={propertyType}
                onValueChange={(v) => { setPropertyType(v); touch("propertyType") }}
              >
                <SelectTrigger id="propertyType" className={inputErrClass("propertyType")}> 
                  <SelectValue placeholder="เลือกประเภท" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="house">บ้าน</SelectItem>
                  <SelectItem value="condo">คอนโด</SelectItem>
                  <SelectItem value="land">ที่ดิน</SelectItem>
                </SelectContent>
              </Select>
              {showErr("propertyType") && <p className="text-xs text-red-600 mt-1">{errors.propertyType}</p>}
            </div>
            <div>
              <Label htmlFor="transactionType">ประเภทการทำธุรกรรม*</Label>
              <Select
                value={transactionType}
                onValueChange={(v) => { setTransactionType(v); touch("transactionType") }}
              >
                <SelectTrigger id="transactionType" className={inputErrClass("transactionType")}> 
                  <SelectValue placeholder="เลือกประเภท" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sale">ขาย</SelectItem>
                  <SelectItem value="rent">เช่า</SelectItem>
                </SelectContent>
              </Select>
              {showErr("transactionType") && <p className="text-xs text-red-600 mt-1">{errors.transactionType}</p>}
            </div>
            <div>
              <Label htmlFor="price">ราคา*</Label>
              <Input
                id="price"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                onBlur={() => touch("price")}
                className={inputErrClass("price")}
                placeholder="฿ 750,000"
                aria-invalid={!!showErr("price")}
              />
              {showErr("price") && <p className="text-xs text-red-600 mt-1">{errors.price}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Property Location */}
        <Card>
          <CardHeader><CardTitle>ที่ตั้งทรัพย์สิน</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="map-search">ค้นหาบนแผนที่</Label>
              <div className="flex gap-2">
                <Input
                  id="map-search"
                  ref={searchRef}
                  placeholder="ค้นหาที่อยู่ คอนโด หรือสถานที่สำคัญ..."
                  className="flex-1"
                />
                <Button type="button" variant="outline" onClick={centerOnUser}>
                  <LocateFixed className="mr-2 h-4 w-4" />
                  ใช้ตำแหน่งของฉัน
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                เลือกจากรายการแนะนำ หรือคลิก/ลากหมุดบนแผนที่เพื่อกำหนดตำแหน่ง
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="address">ที่อยู่*</Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  onBlur={() => touch("address")}
                  className={inputErrClass("address")}
                  placeholder="123 ถนนโอ๊ค"
                  aria-invalid={!!showErr("address")}
                />
                {showErr("address") && <p className="text-xs text-red-600 mt-1">{errors.address}</p>}
              </div>
              <div>
                <Label htmlFor="city">เขต/อำเภอ*</Label>
                <Input
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  onBlur={() => touch("city")}
                  className={inputErrClass("city")}
                  placeholder="เขตปทุมวัน"
                  aria-invalid={!!showErr("city")}
                />
                {showErr("city") && <p className="text-xs text-red-600 mt-1">{errors.city}</p>}
              </div>
              <div>
                <Label htmlFor="province">จังหวัด*</Label>
                <Input
                  id="province"
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  onBlur={() => touch("province")}
                  className={inputErrClass("province")}
                  placeholder="กรุงเทพมหานคร"
                  aria-invalid={!!showErr("province")}
                />
                {showErr("province") && <p className="text-xs text-red-600 mt-1">{errors.province}</p>}
              </div>
              <div>
                <Label htmlFor="postal">รหัสไปรษณีย์*</Label>
                <Input
                  id="postal"
                  value={postal}
                  onChange={(e) => setPostal(e.target.value)}
                  onBlur={() => touch("postal")}
                  className={inputErrClass("postal")}
                  placeholder="10110"
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
                  <p className="text-sm">กำลังโหลดแผนที่...</p>
                  <p className="text-xs">ตรวจ API key และ internet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Property Specifications */}
        <Card>
          <CardHeader><CardTitle>สเปกของทรัพย์</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="landArea">พื้นที่ดิน*</Label>
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
              <Label htmlFor="usableArea">พื้นที่ใช้สอย*</Label>
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
              <Label htmlFor="bedrooms">ห้องนอน*</Label>
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
              <Label htmlFor="bathrooms">ห้องน้ำ*</Label>
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
              <Label htmlFor="parking">ที่จอดรถ</Label>
              <Select value={parking} onValueChange={(v) => setParking(v)}>
                <SelectTrigger id="parking">
                  <SelectValue placeholder="เลือก" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">ไม่มี</SelectItem>
                  <SelectItem value="1">1</SelectItem>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="3">3</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="yearBuilt">สร้างเมื่อปี</Label>
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
          <CardHeader><CardTitle>รายละเอียดเพิ่มเติม</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <Label htmlFor="description">บรรยายทรัพย์สินของคุณ*</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={() => touch("description")}
              className={inputErrClass("description")}
              placeholder="อธิบายจุดเด่น สภาพ และจุดขายของทรัพย์สินของคุณ..."
              rows={5}
              aria-invalid={!!showErr("description")}
            />
            {showErr("description") && <p className="text-xs text-red-600">{errors.description}</p>}
            <p className="text-xs text-gray-500">ขั้นต่ำ 50 ตัวอักษร โปรดบรรยายเพื่อดึงดูดผู้ซื้อ</p>
          </CardContent>
        </Card>

        {/* Property Photos */}
        <Card>
          <CardHeader><CardTitle>รูปภาพทรัพย์ (สูงสุด 50 รูป)</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <Camera className="mx-auto h-10 w-10 text-gray-400 mb-4" />
              <p className="text-sm text-gray-500 mb-4">ลากและวางรูปที่นี่</p>
              <Button onClick={() => photoInputRef.current?.click()}><Upload className="mr-2 h-4 w-4" />เลือกภาพ</Button>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handlePhotosChange}
              />
              {photoPreviews.length > 0 && (
                <>
                  <p className="text-xs text-gray-500 mt-4">เลือกแล้ว {photos.length} รูป</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mt-4">
                    {photoPreviews.map((src, idx) => (
                      <img key={idx} src={src} alt={`preview-${idx}`} className="h-24 w-full object-cover rounded" />
                    ))}
                  </div>
                </>
              )}
              <p className="text-xs text-gray-500 mt-4">รองรับ JPG, PNG, GIF ขนาดไม่เกิน 10MB ต่อไฟล์</p>
            </div>
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <Video className="mx-auto h-10 w-10 text-gray-400 mb-4" />
              <p className="text-sm text-gray-500 mb-4">อัปโหลดวิดีโอหรือทัวร์เสมือน</p>
              <Button variant="outline" onClick={() => videoInputRef.current?.click()}><Upload className="mr-2 h-4 w-4" />เลือกวิดีโอ</Button>
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={handleVideoChange}
              />
              {video && <p className="text-xs text-gray-500 mt-4">{video.name}</p>}
              {videoPreview && (
                <video controls className="mt-4 w-full max-h-64">
                  <source src={videoPreview} type={video?.type} />
                </video>
              )}
              <p className="text-xs text-gray-500 mt-4">สูงสุด 100MB รองรับ MP4, MOV</p>
            </div>
          </CardContent>
        </Card>

        {/* Additional Options */}
        <Card>
          <CardHeader><CardTitle>ตัวเลือกเพิ่มเติม</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-2">
                <Checkbox id="mortgage" />
                <div className="space-y-1">
                  <Label htmlFor="mortgage" className="font-medium">เพิ่มเครื่องคำนวณสินเชื่อ</Label>
                  <p className="text-sm text-gray-500">ช่วยผู้ซื้อประมาณค่างวดรายเดือน</p>
                </div>
              </div>
              <span className="text-sm text-gray-500">ฟรี</span>
            </div>
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-2">
                <Checkbox id="featured" />
                <div className="space-y-1">
                  <Label htmlFor="featured" className="font-medium">ประกาศเด่น</Label>
                  <p className="text-sm text-gray-500">โดดเด่นด้วยตำแหน่งพรีเมียม</p>
                </div>
              </div>
              <span className="text-sm text-gray-500">25 ดอลลาร์/เดือน</span>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-end">
          <Button variant="outline">ดูตัวอย่างประกาศ</Button>
          <Button variant="secondary">บันทึกร่าง</Button>
          <Button onClick={handleSubmit} className="bg-purple-600 text-white hover:bg-purple-700">
            ลงประกาศ
          </Button>
        </div>
      </div>
      <ChatWidget />
    </div>
  )
}
