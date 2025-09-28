"use client"

import Link from "next/link"
import Image from "next/image"
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react"
import { Inter } from "next/font/google"
import {
  Upload,
  Video,
  Camera,
  MapPin,
  LocateFixed,
  Trash2,
} from "lucide-react"

import ChatWidget from "@/components/chat-widget"
import SellAuthPrompt from "@/components/sell-auth-prompt"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { useAuthContext } from "@/contexts/AuthContext"
import {
  addDocument,
  getDocument,
  getFirestoreInstance,
  setDocument,
} from "@/lib/firestore"
import {
  uploadFile,
  uploadFiles,
  getDownloadURL,
  deleteFile,
  extractStoragePathFromUrl,
} from "@/lib/storage"
import { mapDocumentToUserProperty } from "@/lib/user-property-mapper"
import type { UserProperty } from "@/types/user-property"

const inter = Inter({ subsets: ["latin"] })

type LatLng = { lat: number | null; lng: number | null }
type Errors = Record<string, string | undefined>
type Touched = Record<string, boolean>

interface SellPropertyFormProps {
  mode: "create" | "edit"
  propertyId?: string
}

const isNonEmpty = (s: string) => s.trim().length > 0
const isPositive = (s: string) => {
  const n = Number(s)
  return Number.isFinite(n) && n > 0
}
const emailOk = (s: string) => /\S+@\S+\.\S+/.test(s)
const phoneOk = (s: string) => s.replace(/\D/g, "").length >= 6

export function SellPropertyForm({ mode, propertyId }: SellPropertyFormProps) {
  const { user, loading } = useAuthContext()

  const [mapsReady, setMapsReady] = useState(false)
  const mapRef = useRef<HTMLDivElement | null>(null)
  const searchRef = useRef<HTMLInputElement | null>(null)
  const gmap = useRef<google.maps.Map | null>(null)
  const marker = useRef<google.maps.Marker | null>(null)
  const geocoder = useRef<google.maps.Geocoder | null>(null)
  const autocomplete = useRef<google.maps.places.Autocomplete | null>(null)
  const photoInputRef = useRef<HTMLInputElement | null>(null)
  const videoInputRef = useRef<HTMLInputElement | null>(null)

  const [sellerName, setSellerName] = useState("")
  const [sellerPhone, setSellerPhone] = useState("")
  const [sellerEmail, setSellerEmail] = useState("")
  const [sellerRole, setSellerRole] = useState<string>("")

  const [title, setTitle] = useState("")
  const [propertyType, setPropertyType] = useState<string>("")
  const [transactionType, setTransactionType] = useState<string>("")
  const [price, setPrice] = useState("")

  const [address, setAddress] = useState("")
  const [city, setCity] = useState("")
  const [province, setProvince] = useState("")
  const [postal, setPostal] = useState("")
  const [latlng, setLatlng] = useState<LatLng>({ lat: null, lng: null })

  const [landArea, setLandArea] = useState("")
  const [usableArea, setUsableArea] = useState("")
  const [bedrooms, setBedrooms] = useState("")
  const [bathrooms, setBathrooms] = useState("")
  const [parking, setParking] = useState<string>("")
  const [yearBuilt, setYearBuilt] = useState("")

  const [description, setDescription] = useState("")

  const [photos, setPhotos] = useState<File[]>([])
  const [existingPhotoUrls, setExistingPhotoUrls] = useState<string[]>([])
  const [video, setVideo] = useState<File | null>(null)
  const [existingVideoUrl, setExistingVideoUrl] = useState<string | null>(null)
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([])
  const [videoPreview, setVideoPreview] = useState<string | null>(null)
  const [removedPhotoPaths, setRemovedPhotoPaths] = useState<string[]>([])
  const [removedVideoPath, setRemovedVideoPath] = useState<string | null>(null)

  const [errors, setErrors] = useState<Errors>({})
  const [touched, setTouched] = useState<Touched>({})
  const [submitting, setSubmitting] = useState(false)
  const [propertyLoading, setPropertyLoading] = useState(false)
  const [propertyError, setPropertyError] = useState<string | null>(null)
  const initialDataLoadedRef = useRef(false)
  const initialCreatedAtRef = useRef<string>("")

  const touch = (name: string) =>
    setTouched((t) => ({
      ...t,
      [name]: true,
    }))

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
    if (file) {
      if (existingVideoUrl) {
        const path = extractStoragePathFromUrl(existingVideoUrl)
        if (path) {
          setRemovedVideoPath(path)
        }
      }
      setExistingVideoUrl(null)
    }
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

  const requiredFieldKeys = useMemo(
    () =>
      [
        "sellerName",
        "sellerPhone",
        "sellerEmail",
        "sellerRole",
        "title",
        "propertyType",
        "transactionType",
        "price",
        "address",
        "city",
        "province",
        "postal",
        "landArea",
        "usableArea",
        "bedrooms",
        "bathrooms",
        "description",
      ] as const,
    [],
  )

  const validate = (): Errors => {
    const e: Errors = {}

    if (!isNonEmpty(sellerName)) e.sellerName = "จำเป็น"
    if (!isNonEmpty(sellerPhone)) e.sellerPhone = "จำเป็น"
    else if (!phoneOk(sellerPhone)) e.sellerPhone = "เบอร์โทรไม่ถูกต้อง"
    if (!isNonEmpty(sellerEmail)) e.sellerEmail = "จำเป็น"
    else if (!emailOk(sellerEmail)) e.sellerEmail = "อีเมลไม่ถูกต้อง"
    if (!isNonEmpty(sellerRole)) e.sellerRole = "จำเป็น"

    if (!isNonEmpty(title)) e.title = "จำเป็น"
    if (!isNonEmpty(propertyType)) e.propertyType = "จำเป็น"
    if (!isNonEmpty(transactionType)) e.transactionType = "จำเป็น"
    if (!isNonEmpty(price)) e.price = "จำเป็น"
    else if (!isPositive(price)) e.price = "ต้องมากกว่า 0"

    if (!isNonEmpty(address)) e.address = "จำเป็น"
    if (!isNonEmpty(city)) e.city = "จำเป็น"
    if (!isNonEmpty(province)) e.province = "จำเป็น"
    if (!isNonEmpty(postal)) e.postal = "จำเป็น"

    if (!isNonEmpty(landArea)) e.landArea = "จำเป็น"
    else if (!isPositive(landArea)) e.landArea = "ต้องมากกว่า 0"
    if (!isNonEmpty(usableArea)) e.usableArea = "จำเป็น"
    else if (!isPositive(usableArea)) e.usableArea = "ต้องมากกว่า 0"
    if (!isNonEmpty(bedrooms)) e.bedrooms = "จำเป็น"
    else if (!isPositive(bedrooms)) e.bedrooms = "ต้องมากกว่า 0"
    if (!isNonEmpty(bathrooms)) e.bathrooms = "จำเป็น"
    else if (!isPositive(bathrooms)) e.bathrooms = "ต้องมากกว่า 0"

    if (!isNonEmpty(description)) e.description = "จำเป็น"
    else if (description.trim().length < 50)
      e.description = "ขั้นต่ำ 50 ตัวอักษร"

    return e
  }

  const completedCount = useMemo(() => {
    const e = validate()
    return requiredFieldKeys.length -
      Object.keys(e).filter((k) => (e as Record<string, string | undefined>)[k])
        .length
  }, [requiredFieldKeys, sellerName, sellerPhone, sellerEmail, sellerRole, title, propertyType, transactionType, price, address, city, province, postal, landArea, usableArea, bedrooms, bathrooms, description])

  const totalRequired = requiredFieldKeys.length
  const progressPct = Math.round((completedCount / totalRequired) * 100)

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!key) return
    const loadMaps = async () => {
      try {
        const { Loader } = await import("@googlemaps/js-api-loader")
        const loader = new Loader({
          apiKey: key,
          version: "weekly",
          libraries: ["places"],
        })
        await loader.load()
        setMapsReady(true)
      } catch (error) {
        console.error("Failed to load Google Maps", error)
        setMapsReady(false)
      }
    }

    void loadMaps()
  }, [])

  useEffect(() => {
    if (!mapsReady || propertyLoading) return
    if (!mapRef.current) return
    if (gmap.current) return

    const start =
      latlng.lat !== null && latlng.lng !== null
        ? { lat: latlng.lat, lng: latlng.lng }
        : { lat: 13.7563, lng: 100.5018 }

    gmap.current = new google.maps.Map(mapRef.current, {
      center: start,
      zoom: latlng.lat !== null && latlng.lng !== null ? 16 : 12,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
    })
    marker.current = new google.maps.Marker({
      map: gmap.current,
      position: start,
      draggable: true,
    })
    geocoder.current = new google.maps.Geocoder()

    gmap.current.addListener("click", (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return
      placeMarkerAndFill(e.latLng)
    })

    marker.current.addListener("dragend", () => {
      const pos = marker.current?.getPosition()
      if (pos) placeMarkerAndFill(pos)
    })

    if (searchRef.current) {
      autocomplete.current = new google.maps.places.Autocomplete(
        searchRef.current,
        {
          fields: ["geometry", "address_components", "formatted_address"],
          types: ["geocode"],
        },
      )
      autocomplete.current.bindTo("bounds", gmap.current)
      autocomplete.current.addListener("place_changed", () => {
        const place = autocomplete.current?.getPlace()
        if (!place?.geometry?.location) return
        const loc = place.geometry.location
        gmap.current?.panTo(loc)
        gmap.current?.setZoom(16)
        marker.current?.setPosition(loc)
        setLatlng({ lat: loc.lat(), lng: loc.lng() })
        fillAddressFromComponents(
          place.address_components ?? [],
          place.formatted_address,
        )
      })
    }

    if (latlng.lat !== null && latlng.lng !== null) {
      const loc = new google.maps.LatLng(latlng.lat, latlng.lng)
      gmap.current.panTo(loc)
      gmap.current.setZoom(16)
      marker.current.setPosition(loc)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapsReady, propertyLoading])

  useEffect(() => {
    if (!mapsReady || !gmap.current || !marker.current) return
    if (latlng.lat === null || latlng.lng === null) return
    const pos = new google.maps.LatLng(latlng.lat, latlng.lng)
    marker.current.setPosition(pos)
    gmap.current.panTo(pos)
    gmap.current.setZoom(16)
  }, [latlng.lat, latlng.lng, mapsReady])

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
      () => console.error("ไม่สามารถรับตำแหน่งของคุณได้"),
    )
  }

  const placeMarkerAndFill = (pos: google.maps.LatLng) => {
    marker.current?.setPosition(pos)
    gmap.current?.panTo(pos)
    setLatlng({ lat: pos.lat(), lng: pos.lng() })
    if (!geocoder.current) return
    geocoder.current.geocode({ location: pos }, (results, status) => {
      if (status === "OK" && results && results[0]) {
        fillAddressFromComponents(
          results[0].address_components ?? [],
          results[0].formatted_address,
        )
        if (searchRef.current)
          searchRef.current.value = results[0].formatted_address ?? ""
      }
    })
  }

  const fillAddressFromComponents = (
    components: google.maps.GeocoderAddressComponent[],
    formatted?: string,
  ) => {
    const get = (type: string) =>
      components.find((c) => c.types.includes(type))?.long_name ?? ""
    const streetNumber = get("street_number")
    const route = get("route")
    const sublocality = get("sublocality") || get("sublocality_level_1")
    const locality = get("locality") || get("administrative_area_level_2")
    const admin1 = get("administrative_area_level_1")
    const zip = get("postal_code")

    const addr =
      [streetNumber, route].filter(Boolean).join(" ") ||
      [route, sublocality].filter(Boolean).join(", ") ||
      formatted ||
      ""

    setAddress(addr)
    touch("address")
    setCity(locality || sublocality || "")
    touch("city")
    setProvince(admin1 || "")
    touch("province")
    setPostal(zip || "")
    touch("postal")
  }

  useEffect(() => {
    if (mode !== "edit") return
    if (!user || !propertyId) return
    if (initialDataLoadedRef.current) return

    const load = async () => {
      setPropertyLoading(true)
      setPropertyError(null)
      try {
        const docSnap = await getDocument(
          `users/${user.uid}/user_property`,
          propertyId,
        )
        if (!docSnap) {
          setPropertyError("ไม่พบประกาศนี้หรือถูกลบไปแล้ว")
          setPropertyLoading(false)
          return
        }
        const propertyDoc = await getDocument("property", propertyId)
        if (propertyDoc) {
          const data = propertyDoc.data() as { userRef?: unknown }
          if (!data?.userRef) {
            try {
              const { doc } = await import("firebase/firestore")
              const ownerRef = doc(
                await getFirestoreInstance(),
                "users",
                user.uid,
              )
              await setDocument("property", propertyId, { userRef: ownerRef })
            } catch (patchError) {
              console.error("Failed to backfill property ownerRef", patchError)
            }
          }
        }
        const property = mapDocumentToUserProperty(docSnap)
        applyInitialProperty(property)
        initialDataLoadedRef.current = true
      } catch (error) {
        console.error("Failed to load property", error)
        setPropertyError("ไม่สามารถโหลดข้อมูลประกาศได้")
      } finally {
        setPropertyLoading(false)
      }
    }

    void load()
  }, [mode, user, propertyId])

  const applyInitialProperty = (property: UserProperty) => {
    setSellerName(property.sellerName)
    setSellerPhone(property.sellerPhone)
    setSellerEmail(property.sellerEmail)
    setSellerRole(property.sellerRole)
    setTitle(property.title)
    setPropertyType(property.propertyType)
    setTransactionType(property.transactionType)
    setPrice(property.price ? property.price.toString() : "")
    setAddress(property.address)
    setCity(property.city)
    setProvince(property.province)
    setPostal(property.postal)
    setLatlng({ lat: property.lat, lng: property.lng })
    setLandArea(property.landArea)
    setUsableArea(property.usableArea)
    setBedrooms(property.bedrooms)
    setBathrooms(property.bathrooms)
    setParking(property.parking ?? "")
    setYearBuilt(property.yearBuilt ?? "")
    setDescription(property.description)
    setExistingPhotoUrls(property.photos ?? [])
    setExistingVideoUrl(property.video ?? null)
    setRemovedPhotoPaths([])
    setRemovedVideoPath(null)
    if (searchRef.current) {
      const formattedLocation = [
        property.address,
        property.city,
        property.province,
      ]
        .map((part) => part?.trim())
        .filter(Boolean)
        .join(", ")

      searchRef.current.value = formattedLocation || property.address || ""
    }
    initialCreatedAtRef.current = property.createdAt
  }

  const handleSubmit = async () => {
    const e = validate()
    setErrors(e)
    const t: Touched = {}
    requiredFieldKeys.forEach((k) => {
      t[k] = true
    })
    setTouched((old) => ({ ...old, ...t }))

    const firstErrorKey = requiredFieldKeys.find((k) => e[k])
    if (firstErrorKey) {
      const el = document.getElementById(firstErrorKey)
      if (el?.scrollIntoView)
        el.scrollIntoView({ behavior: "smooth", block: "center" })
      return
    }

    if (!user) return

    const { doc } = await import("firebase/firestore")
    const ownerRef = doc(await getFirestoreInstance(), "users", user.uid)

    try {
      setSubmitting(true)


      const ensureUserDocExists = async () => {
        const userDoc = await getDocument("users", user.uid)
        if (!userDoc) {
          await setDocument("users", user.uid, { uid: user.uid })
        }
      }

      await ensureUserDocExists()


      const propertyBase = {
        userUid: user.uid,
        userRef: ownerRef,
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
      }

      if (mode === "create") {
        const createdAt = new Date().toISOString()
        const docRef = await addDocument(
          `users/${user.uid}/user_property`,
          {
            ...propertyBase,
            photos: [] as string[],
            video: null as string | null,
            createdAt,
          },
        )
        const newPropertyId = docRef.id

        const imageData = photos.map((file, idx) => ({
          path: `user/${user.uid}/property/${newPropertyId}/images/${idx}-${file.name}`,
          file,
        }))
        await uploadFiles(imageData)
        const photoUrls = await Promise.all(
          imageData.map(({ path }) => getDownloadURL(path)),
        )

        let videoUrl: string | null = null
        if (video) {
          const videoPath = `user/${user.uid}/property/${newPropertyId}/videos/${video.name}`
          await uploadFile(videoPath, video)
          videoUrl = await getDownloadURL(videoPath)
        }

        await setDocument(`users/${user.uid}/user_property`, newPropertyId, {
          photos: photoUrls,
          video: videoUrl,
        })

        await setDocument("property", newPropertyId, {
          ...propertyBase,
          userUid: user.uid,
          photos: photoUrls,
          video: videoUrl,
          createdAt,
        })

        alert("บันทึกเรียบร้อย!")
      } else if (mode === "edit" && propertyId) {
        const createdAt =
          initialCreatedAtRef.current || new Date().toISOString()

        const imageData = photos.map((file, idx) => ({
          path: `user/${user.uid}/property/${propertyId}/images/${Date.now()}-${idx}-${file.name}`,
          file,
        }))
        if (imageData.length > 0) {
          await uploadFiles(imageData)
        }
        const newPhotoUrls = await Promise.all(
          imageData.map(({ path }) => getDownloadURL(path)),
        )
        const finalPhotoUrls = [...existingPhotoUrls, ...newPhotoUrls]

        let finalVideoUrl = existingVideoUrl
        if (video) {
          const videoPath = `user/${user.uid}/property/${propertyId}/videos/${video.name}`
          await uploadFile(videoPath, video)
          finalVideoUrl = await getDownloadURL(videoPath)
        }

        await setDocument(`users/${user.uid}/user_property`, propertyId, {
          ...propertyBase,
          photos: finalPhotoUrls,
          video: finalVideoUrl,
          createdAt,
        })

        await setDocument("property", propertyId, {
          ...propertyBase,
          photos: finalPhotoUrls,
          video: finalVideoUrl,
          createdAt,
        })

        if (removedPhotoPaths.length > 0) {
          await Promise.all(
            removedPhotoPaths.map(async (path) => {
              try {
                await deleteFile(path)
              } catch (error) {
                console.error("Failed to delete photo from storage", error)
              }
            }),
          )
          setRemovedPhotoPaths([])
        }

        if (removedVideoPath) {
          try {
            await deleteFile(removedVideoPath)
          } catch (error) {
            console.error("Failed to delete video from storage", error)
          }
          setRemovedVideoPath(null)
        }

        alert("อัปเดตประกาศเรียบร้อย!")
      }
    } catch (err) {
      console.error(err)
      alert("เกิดข้อผิดพลาดในการบันทึก")
    } finally {
      setSubmitting(false)
    }
  }

  const showErr = (key: string) => touched[key] && errors[key]
  const inputErrClass = (key: string) =>
    showErr(key) ? "border-red-500 focus-visible:ring-red-500" : ""

  const handleRemoveExistingPhoto = (url: string) => {
    setExistingPhotoUrls((prev) => prev.filter((item) => item !== url))
    const path = extractStoragePathFromUrl(url)
    if (path) {
      setRemovedPhotoPaths((prev) =>
        prev.includes(path) ? prev : [...prev, path],
      )
    }
  }

  const handleRemoveExistingVideo = () => {
    if (existingVideoUrl) {
      const path = extractStoragePathFromUrl(existingVideoUrl)
      if (path) {
        setRemovedVideoPath(path)
      }
    }
    setExistingVideoUrl(null)
  }

  if (loading) return null
  if (!user) return <SellAuthPrompt />

  if (mode === "edit" && propertyLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">กำลังโหลดข้อมูลประกาศ...</p>
      </div>
    )
  }

  if (mode === "edit" && propertyError) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="rounded-lg border bg-white p-6 text-center shadow-sm">
          <p className="text-red-600">{propertyError}</p>
          <Button className="mt-4" asChild>
            <Link href="/sell">กลับไปหน้าประกาศของฉัน</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={`${inter.className} bg-gray-50 min-h-screen`}>
      <div className="max-w-4xl mx-auto p-4 sm:p-8 space-y-8">
        <header className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <h1 className="text-3xl font-bold">
              {mode === "edit" ? "แก้ไขประกาศอสังหาของคุณ" : "ลงประกาศขายอสังหาของคุณ"}
            </h1>
            <Link href="/sell">
              <Button variant="outline">กลับไปประกาศของฉัน</Button>
            </Link>
          </div>

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

        <Card>
          <CardHeader>
            <CardTitle>ข้อมูลผู้ขาย</CardTitle>
          </CardHeader>
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
              {showErr("sellerName") && (
                <p className="text-xs text-red-600 mt-1">{errors.sellerName}</p>
              )}
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
              {showErr("sellerPhone") && (
                <p className="text-xs text-red-600 mt-1">{errors.sellerPhone}</p>
              )}
            </div>
            <div>
              <Label htmlFor="sellerEmail">อีเมล*</Label>
              <Input
                id="sellerEmail"
                value={sellerEmail}
                onChange={(e) => setSellerEmail(e.target.value)}
                onBlur={() => touch("sellerEmail")}
                className={inputErrClass("sellerEmail")}
                placeholder="name@example.com"
                aria-invalid={!!showErr("sellerEmail")}
              />
              {showErr("sellerEmail") && (
                <p className="text-xs text-red-600 mt-1">{errors.sellerEmail}</p>
              )}
            </div>
            <div>
              <Label htmlFor="sellerRole">สถานะผู้ขาย*</Label>
              <Select value={sellerRole} onValueChange={(v) => setSellerRole(v)}>
                <SelectTrigger id="sellerRole" className={inputErrClass("sellerRole")}>
                  <SelectValue placeholder="เลือกสถานะ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="owner">เจ้าของทรัพย์</SelectItem>
                  <SelectItem value="agent">นายหน้า</SelectItem>
                  <SelectItem value="developer">ผู้พัฒนาโครงการ</SelectItem>
                </SelectContent>
              </Select>
              {showErr("sellerRole") && (
                <p className="text-xs text-red-600 mt-1">{errors.sellerRole}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>ข้อมูลทรัพย์</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="title">หัวข้อประกาศ*</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => touch("title")}
                className={inputErrClass("title")}
                placeholder="บ้านเดี่ยวพร้อมอยู่"
                aria-invalid={!!showErr("title")}
              />
              {showErr("title") && (
                <p className="text-xs text-red-600 mt-1">{errors.title}</p>
              )}
            </div>
            <div>
              <Label htmlFor="propertyType">ประเภททรัพย์*</Label>
              <Select
                value={propertyType}
                onValueChange={(v) => setPropertyType(v)}
              >
                <SelectTrigger
                  id="propertyType"
                  className={inputErrClass("propertyType")}
                >
                  <SelectValue placeholder="เลือกประเภท" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="house">บ้านเดี่ยว</SelectItem>
                  <SelectItem value="condo">คอนโดมิเนียม</SelectItem>
                  <SelectItem value="land">ที่ดิน</SelectItem>
                </SelectContent>
              </Select>
              {showErr("propertyType") && (
                <p className="text-xs text-red-600 mt-1">
                  {errors.propertyType}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="transactionType">รูปแบบประกาศ*</Label>
              <Select
                value={transactionType}
                onValueChange={(v) => setTransactionType(v)}
              >
                <SelectTrigger
                  id="transactionType"
                  className={inputErrClass("transactionType")}
                >
                  <SelectValue placeholder="เลือก" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sell">ขาย</SelectItem>
                  <SelectItem value="rent">เช่า</SelectItem>
                </SelectContent>
              </Select>
              {showErr("transactionType") && (
                <p className="text-xs text-red-600 mt-1">
                  {errors.transactionType}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="price">ราคา*</Label>
              <Input
                id="price"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                onBlur={() => touch("price")}
                className={inputErrClass("price")}
                placeholder="10000000"
                aria-invalid={!!showErr("price")}
              />
              {showErr("price") && (
                <p className="text-xs text-red-600 mt-1">{errors.price}</p>
              )}
            </div>
            <div className="sm:col-span-2 space-y-2">
              <Label htmlFor="search">ค้นหาที่อยู่บนแผนที่</Label>
              <div className="flex gap-2 flex-wrap">
                <Input
                  id="search"
                  ref={searchRef}
                  placeholder="พิมพ์ที่อยู่หรือสถานที่"
                  className="flex-1 min-w-[200px]"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={centerOnUser}
                >
                  <LocateFixed className="mr-2 h-4 w-4" />
                  ใช้ตำแหน่งปัจจุบัน
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
                {showErr("address") && (
                  <p className="text-xs text-red-600 mt-1">{errors.address}</p>
                )}
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
                {showErr("city") && (
                  <p className="text-xs text-red-600 mt-1">{errors.city}</p>
                )}
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
                {showErr("province") && (
                  <p className="text-xs text-red-600 mt-1">{errors.province}</p>
                )}
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
                {showErr("postal") && (
                  <p className="text-xs text-red-600 mt-1">{errors.postal}</p>
                )}
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

        <Card>
          <CardHeader>
            <CardTitle>สเปกของทรัพย์</CardTitle>
          </CardHeader>
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
              {showErr("landArea") && (
                <p className="text-xs text-red-600 mt-1">{errors.landArea}</p>
              )}
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
              {showErr("usableArea") && (
                <p className="text-xs text-red-600 mt-1">{errors.usableArea}</p>
              )}
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
              {showErr("bedrooms") && (
                <p className="text-xs text-red-600 mt-1">{errors.bedrooms}</p>
              )}
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
              {showErr("bathrooms") && (
                <p className="text-xs text-red-600 mt-1">{errors.bathrooms}</p>
              )}
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

        <Card>
          <CardHeader>
            <CardTitle>รายละเอียดเพิ่มเติม</CardTitle>
          </CardHeader>
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
            {showErr("description") && (
              <p className="text-xs text-red-600">{errors.description}</p>
            )}
            <p className="text-xs text-gray-500">
              ขั้นต่ำ 50 ตัวอักษร โปรดบรรยายเพื่อดึงดูดผู้ซื้อ
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>รูปภาพทรัพย์ (สูงสุด 50 รูป)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {existingPhotoUrls.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">รูปภาพปัจจุบัน</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {existingPhotoUrls.map((url) => (
                    <div key={url} className="relative">
                      <Image
                        src={url}
                        alt="property-photo"
                        width={300}
                        height={200}
                        className="h-24 w-full object-cover rounded"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveExistingPhoto(url)}
                        className="absolute right-1 top-1 inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-red-500 shadow"
                        aria-label="ลบรูปภาพนี้"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <Camera className="mx-auto h-10 w-10 text-gray-400 mb-4" />
              <p className="text-sm text-gray-500 mb-4">ลากและวางรูปที่นี่</p>
              <Button onClick={() => photoInputRef.current?.click()}>
                <Upload className="mr-2 h-4 w-4" />
                เลือกภาพ
              </Button>
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
                  <p className="text-xs text-gray-500 mt-4">
                    เลือกแล้ว {photos.length} รูป
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mt-4">
                    {photoPreviews.map((src, idx) => (
                      <img
                        key={idx}
                        src={src}
                        alt={`preview-${idx}`}
                        className="h-24 w-full object-cover rounded"
                      />
                    ))}
                  </div>
                </>
              )}
              <p className="text-xs text-gray-500 mt-4">
                รองรับ JPG, PNG, GIF ขนาดไม่เกิน 10MB ต่อไฟล์
              </p>
            </div>

            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <Video className="mx-auto h-10 w-10 text-gray-400 mb-4" />
              <p className="text-sm text-gray-500 mb-4">
                อัปโหลดวิดีโอหรือทัวร์เสมือน
              </p>
              <div className="flex flex-col items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => videoInputRef.current?.click()}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  เลือกวิดีโอ
                </Button>
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={handleVideoChange}
                />
                {existingVideoUrl && !video && (
                  <div className="w-full space-y-2">
                    <video controls className="mt-2 w-full max-h-64 rounded">
                      <source src={existingVideoUrl} />
                    </video>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={handleRemoveExistingVideo}
                    >
                      ลบวิดีโอปัจจุบัน
                    </Button>
                  </div>
                )}
                {video && (
                  <p className="text-xs text-gray-500 mt-2">{video.name}</p>
                )}
                {videoPreview && (
                  <video controls className="mt-4 w-full max-h-64 rounded">
                    <source src={videoPreview} type={video?.type} />
                  </video>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-4">
                สูงสุด 100MB รองรับ MP4, MOV
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>ตัวเลือกเพิ่มเติม</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-2">
                <Checkbox id="mortgage" />
                <div className="space-y-1">
                  <Label htmlFor="mortgage" className="font-medium">
                    เพิ่มเครื่องคำนวณสินเชื่อ
                  </Label>
                  <p className="text-sm text-gray-500">
                    ช่วยผู้ซื้อประมาณค่างวดรายเดือน
                  </p>
                </div>
              </div>
              <span className="text-sm text-gray-500">ฟรี</span>
            </div>
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-2">
                <Checkbox id="featured" />
                <div className="space-y-1">
                  <Label htmlFor="featured" className="font-medium">
                    ประกาศเด่น
                  </Label>
                  <p className="text-sm text-gray-500">
                    โดดเด่นด้วยตำแหน่งพรีเมียม
                  </p>
                </div>
              </div>
              <span className="text-sm text-gray-500">25 ดอลลาร์/เดือน</span>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-4 justify-end">
          <Button variant="outline">ดูตัวอย่างประกาศ</Button>
          <Button variant="secondary">บันทึกร่าง</Button>
          <Button
            onClick={handleSubmit}
            className="bg-purple-600 text-white hover:bg-purple-700"
            disabled={submitting}
          >
            {submitting
              ? "กำลังบันทึก..."
              : mode === "edit"
                ? "อัปเดตประกาศ"
                : "ลงประกาศ"}
          </Button>
        </div>
      </div>
      <ChatWidget />
    </div>
  )
}

export default SellPropertyForm
