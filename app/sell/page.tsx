import { Inter } from "next/font/google"
import ChatWidget from "@/components/chat-widget"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Upload, Video, Camera, MapPin, TreePine, Building2, Waves, Shield, Dumbbell, Square, Wifi, Flame } from "lucide-react"

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

export default function SellPage() {
  return (
    <div className={`${inter.className} bg-gray-50 min-h-screen`}>
      <div className="max-w-4xl mx-auto p-4 sm:p-8 space-y-8">
        <header className="space-y-4 text-center">
          <h1 className="text-3xl font-bold">Post Your Property for Sale</h1>
          <div>
            <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
              <span>Progress</span>
              <span>10% Complete</span>
            </div>
            <div className="w-full bg-gray-200 h-2 rounded-full">
              <div className="h-2 bg-purple-600 rounded-full" style={{ width: "10%" }} />
            </div>
          </div>
        </header>

        {/* Seller Information */}
        <Card>
          <CardHeader>
            <CardTitle>Seller Information</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="seller-name">Full Name*</Label>
              <Input id="seller-name" placeholder="Enter your full name" />
            </div>
            <div>
              <Label htmlFor="seller-phone">Phone Number*</Label>
              <Input id="seller-phone" placeholder="+1 (555) 123-4567" />
            </div>
            <div>
              <Label htmlFor="seller-email">Email Address*</Label>
              <Input id="seller-email" placeholder="you@example.com" />
            </div>
            <div>
              <Label htmlFor="seller-role">Role*</Label>
              <Select>
                <SelectTrigger id="seller-role">
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="owner">Owner</SelectItem>
                  <SelectItem value="agent">Agent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Property Basic Details */}
        <Card>
          <CardHeader>
            <CardTitle>Property Basic Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="title">Property Title*</Label>
              <Input
                id="title"
                placeholder="e.g., Modern 2 Storey House in City Center"
              />
            </div>
            <div>
              <Label htmlFor="property-type">Property Type*</Label>
              <Select>
                <SelectTrigger id="property-type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="house">House</SelectItem>
                  <SelectItem value="condo">Condo</SelectItem>
                  <SelectItem value="land">Land</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="transaction-type">Transaction Type*</Label>
              <Select>
                <SelectTrigger id="transaction-type">
                  <SelectValue placeholder="Select transaction" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sale">Sale</SelectItem>
                  <SelectItem value="rent">Rent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="price">Price*</Label>
              <Input id="price" type="number" placeholder="$ 750,000" />
            </div>
          </CardContent>
        </Card>

        {/* Property Location */}
        <Card>
          <CardHeader>
            <CardTitle>Property Location</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="address">Address*</Label>
                <Input id="address" placeholder="123 Oak Street" />
              </div>
              <div>
                <Label htmlFor="city">City*</Label>
                <Input id="city" placeholder="Metro City" />
              </div>
              <div>
                <Label htmlFor="province">Province/State*</Label>
                <Input id="province" placeholder="California" />
              </div>
              <div>
                <Label htmlFor="postal">Postal Code*</Label>
                <Input id="postal" placeholder="90210" />
              </div>
            </div>
            <div className="border-2 border-dashed rounded-lg h-48 flex flex-col items-center justify-center text-gray-500">
              <MapPin className="h-6 w-6 mb-2" />
              <p className="text-sm">Click to set location on map</p>
              <p className="text-xs">Interactive map will appear here</p>
            </div>
          </CardContent>
        </Card>

        {/* Property Specifications */}
        <Card>
          <CardHeader>
            <CardTitle>Property Specifications</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="land-area">Land Area*</Label>
              <Input id="land-area" placeholder="2400" />
            </div>
            <div>
              <Label htmlFor="usable-area">Usable Area*</Label>
              <Input id="usable-area" placeholder="1800" />
            </div>
            <div>
              <Label htmlFor="bedrooms">Bedrooms*</Label>
              <Input id="bedrooms" placeholder="3" />
            </div>
            <div>
              <Label htmlFor="bathrooms">Bathrooms*</Label>
              <Input id="bathrooms" placeholder="2" />
            </div>
            <div>
              <Label htmlFor="parking">Parking Spaces</Label>
              <Select>
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
              <Label htmlFor="year-built">Year Built</Label>
              <Input id="year-built" placeholder="2020" />
            </div>
          </CardContent>
        </Card>

        {/* Property Features & Amenities */}
        <Card>
          <CardHeader>
            <CardTitle>Property Features & Amenities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {features.map((feature) => (
                <div
                  key={feature.id}
                  className="flex items-center space-x-2 rounded-md border p-2"
                >
                  <Checkbox id={feature.id} />
                  <Label
                    htmlFor={feature.id}
                    className="flex items-center space-x-2 cursor-pointer font-normal"
                  >
                    <feature.icon className="h-4 w-4" />
                    <span className="text-sm">{feature.label}</span>
                  </Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Property Description */}
        <Card>
          <CardHeader>
            <CardTitle>Property Description</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Label htmlFor="description">Describe your property*</Label>
            <Textarea
              id="description"
              placeholder="Describe the highlights, condition, and unique selling points of your property..."
              rows={5}
            />
            <p className="text-xs text-gray-500">
              Minimum 50 characters. Be descriptive to attract more buyers.
            </p>
          </CardContent>
        </Card>

        {/* Property Photos */}
        <Card>
          <CardHeader>
            <CardTitle>Property Photos (Max 20 photos)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <Camera className="mx-auto h-10 w-10 text-gray-400 mb-4" />
              <p className="text-sm text-gray-500 mb-4">
                Drag and drop photos here
              </p>
              <Button>
                <Upload className="mr-2 h-4 w-4" />
                Choose Photos
              </Button>
              <p className="text-xs text-gray-500 mt-4">
                Supported formats: JPG, PNG, GIF. Max size 10MB each.
              </p>
            </div>
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <Video className="mx-auto h-10 w-10 text-gray-400 mb-4" />
              <p className="text-sm text-gray-500 mb-4">
                Upload a video or virtual tour
              </p>
              <Button variant="outline">
                <Upload className="mr-2 h-4 w-4" />
                Choose Video
              </Button>
              <p className="text-xs text-gray-500 mt-4">
                Max 100MB. MP4, MOV formats.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Additional Options */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-2">
                <Checkbox id="mortgage" />
                <div className="space-y-1">
                  <Label htmlFor="mortgage" className="font-medium">
                    Include Mortgage Calculator
                  </Label>
                  <p className="text-sm text-gray-500">
                    Help buyers estimate monthly payments
                  </p>
                </div>
              </div>
              <span className="text-sm text-gray-500">Free</span>
            </div>
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-2">
                <Checkbox id="featured" />
                <div className="space-y-1">
                  <Label htmlFor="featured" className="font-medium">
                    Featured Listing
                  </Label>
                  <p className="text-sm text-gray-500">
                    Stand out with premium placement
                  </p>
                </div>
              </div>
              <span className="text-sm text-gray-500">$25/month</span>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-4 justify-end">
          <Button variant="outline">Preview Listing</Button>
          <Button variant="secondary">Save Draft</Button>
          <Button className="bg-purple-600 text-white hover:bg-purple-700">
            Post Property
          </Button>
        </div>
      </div>
      <ChatWidget />
    </div>
  )
}
