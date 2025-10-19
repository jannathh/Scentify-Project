"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Loader2, ArrowRight, RefreshCw, ThumbsUp, Wind, Droplets, FlaskRoundIcon as Flask } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useCart } from "@/lib/cart-context"
import { useWishlist } from "@/lib/wishlist-context"

import { firestore } from "./firebase";
import { doc, onSnapshot, DocumentSnapshot } from "firebase/firestore";

// Helper function to format prices consistently
const formatPrice = (price: number): string => {
  return `${price.toFixed(2)} AED`
}

// Update the recommended scents to include the new perfumes
const recommendedScents = [
  {
    id: 302,
    name: "Santal 33",
    description: "A modern, earthy fragrance with woody, spicy, and leathery notes by Le Labo with a cult following",
    price: 189.99,
    image: "/placeholder.svg?height=400&width=300",
    category: "Unisex",
    similarityScore: 92,
  },
  {
    id: 303,
    name: "Dior Sauvage",
    description:
      "A bold, rugged, and magnetic fragrance with fresh, spicy, and aromatic notes. A versatile crowd-pleaser.",
    price: 149.99,
    image: "/Dior.jpg",
    category: "Men",
    similarityScore: 85,
  },
  {
    id: 304,
    name: "Coco Mademoiselle",
    description: "A feminine, classy, and timeless oriental floral fragrance great for formal or romantic occasions.",
    price: 159.99,
    image: "/Coco.jpg",
    category: "Women",
    similarityScore: 78,
  },
]

export default function ScentFinderPage() {
  const [sensingState, setSensingState] = useState<"initial" | "sensing" | "processing" | "results">("initial")
  const [sensorReadings, setSensorReadings] = useState<{ [key: string]: number }>({
    "MQ-3": 0, // Alcohol sensor
    "MQ-4": 0, // Methane/combustible gases sensor
    "MQ-135": 0, // Air quality/VOC sensor
  })
  const [sensingProgress, setSensingProgress] = useState(0)
  const { toast } = useToast()
  const { addItem } = useCart()
  const { addToWishlist, isInWishlist, removeFromWishlist } = useWishlist()
  const [detectedScent, setDetectedScent] = useState<any>(null)

  const updateProgress = (data: { [key: string]: number }) => {
    const progress = Math.min(100, (data["MQ-3"] + data["MQ-4"] + data["MQ-135"]) / 3);
    setSensingProgress(progress);
  };

  // Function to start sensing by subscribing to Firestore updates
  const startSensing = async () => {
    setSensingState("sensing")
    setSensingProgress(0)

    try {
      // Listen to sensor data updates from Firestore.
      const sensorDoc = doc(firestore, "scentify", "currentPrediction") // Adjust collection/document as needed
      const unsubscribe = onSnapshot(sensorDoc, (docSnapshot: DocumentSnapshot) => {
        const data = docSnapshot.data()
        if (data) {
          setSensorReadings(data)
          updateProgress(data)
          console.log("Sensor data received:", data);
          console.log("Updated sensing progress:", sensingProgress);
          // Check if progress is complete
          if (sensingProgress >= 100) {
            setSensingState("processing")
            setTimeout(() => {
              setSensingState("results")
            }, 500)
            console.log("Transitioning to processing state");
            // Unsubscribe if you no longer need to listen.
            unsubscribe()
          }
        }
      })
    } catch (error) {
      console.error("Error connecting to sensors:", error)
      toast({
        title: "Sensor connection error",
        description: "We couldn't connect to our scent sensors. Please try again.",
        variant: "destructive",
      })
      setSensingState("initial")
    }
  }

  const resetSensor = () => {
    setSensingState("initial")
    setSensingProgress(0)
    setSensorReadings({
      "MQ-3": 0,
      "MQ-4": 0,
      "MQ-135": 0,
    })
  }

  const handleAddToCart = (product: typeof detectedScent) => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      size: "50ml", // Default size
      quantity: 1,
    })

    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart.`,
    })
  }

  const handleToggleWishlist = (product: typeof detectedScent) => {
    const isCurrentlyInWishlist = isInWishlist(product.id)

    if (isCurrentlyInWishlist) {
      removeFromWishlist(product.id)
      toast({
        title: "Removed from wishlist",
        description: `${product.name} has been removed from your wishlist.`,
      })
    } else {
      addToWishlist({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        category: product.category,
      })
      toast({
        title: "Added to wishlist",
        description: `${product.name} has been added to your wishlist.`,
      })
    }
  }

  const getDetectedScent = (sensorData: { [key: string]: number }) => {
    // Example logic to determine detected scent based on sensor data
    if (sensorData["MQ-3"] > 30) {
      return {
        id: 301,
        name: "Baccarat Rouge 540",
        description: "A luxurious, warm, and slightly sweet fragrance with amber, woody, and floral notes.",
        price: 299.99,
        image: "/Rouge.jpg",
        category: "Unisex",
        notes: {
          top: ["Saffron", "Jasmine"],
          heart: ["Amberwood", "Ambergris"],
          base: ["Fir Resin", "Cedar"],
        },
        sizes: ["50ml", "70ml", "200ml"],
        similarityScore: 98,
      };
    } else if (sensorData["MQ-4"] > 30) {
      return {
        id: 302,
        name: "Santal 33",
        description: "A modern, earthy fragrance with woody, spicy, and leathery notes.",
        price: 189.99,
        image: "/Santal.jpg",
        category: "Unisex",
        similarityScore: 92,
      };
    }
    // Add more conditions for other perfumes
    return null; // Default case if no match
  };

  console.log("Current sensing state:", sensingState);
  console.log("Current sensing progress:", sensingProgress);

  return (
    <div className="container py-10">
      <h1 className="text-4xl font-bold mb-4 text-center ombre-text">Scent Finder</h1>

      {sensingState === "initial" && (
        <div className="max-w-3xl mx-auto text-center animate-fade-in">
          <div className="mb-8">
            <div className="relative h-64 w-64 mx-auto mb-6">
              <Image
                src="/placeholder.svg?height=256&width=256"
                alt="Scent finder illustration"
                fill
                className="object-contain"
              />
            </div>
            <h2 className="text-2xl font-semibold mb-4">Confused about finding your next favorite scent?</h2>
            <p className="text-muted-foreground mb-6">
              Our IoT-driven smart system can help! Simply present your favorite perfume near our specialized MQ gas
              sensors (MQ-3, MQ-4, and MQ-135), and we'll analyze its molecular composition to recommend similar
              fragrances from our collection.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={startSensing} className="ombre-button">
                <Wind className="mr-2 h-5 w-5" /> Start Sensing
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/products" className="flex items-center">
                  Browse All Fragrances
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 text-left">
            <div className="bg-muted/30 p-6 rounded-lg">
              <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary/20 mb-4 mx-auto">
                <span className="font-bold text-primary">1</span>
              </div>
              <h3 className="font-medium text-lg mb-2 text-center">Present Your Perfume</h3>
              <p className="text-sm text-muted-foreground">
                Hold your favorite perfume bottle near our sensor array. A gentle spray or open bottle works best for
                accurate readings.
              </p>
            </div>
            <div className="bg-muted/30 p-6 rounded-lg">
              <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary/20 mb-4 mx-auto">
                <span className="font-bold text-primary">2</span>
              </div>
              <h3 className="font-medium text-lg mb-2 text-center">Sensor Analysis</h3>
              <p className="text-sm text-muted-foreground">
                Our MQ gas sensors will detect the fragrance molecules and our ML algorithm will analyze the scent
                profile.
              </p>
            </div>
            <div className="bg-muted/30 p-6 rounded-lg">
              <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary/20 mb-4 mx-auto">
                <span className="font-bold text-primary">3</span>
              </div>
              <h3 className="font-medium text-lg mb-2 text-center">Discover Matches</h3>
              <p className="text-sm text-muted-foreground">
                We'll show you the closest matches from our collection, along with detailed information about each
                fragrance.
              </p>
            </div>
          </div>
        </div>
      )}

      {sensingState === "sensing" && (
        <div className="max-w-2xl mx-auto text-center animate-fade-in">
          <div className="relative mb-8">
            <div className="aspect-video bg-muted/50 rounded-lg overflow-hidden relative p-6">
              {/* IoT Sensor Visualization */}
              <div className="grid grid-cols-3 gap-4 h-full">
                <div className="col-span-1 flex flex-col justify-center items-center">
                  <div className="text-center mb-6">
                    <Flask className="h-12 w-12 text-primary mx-auto mb-2" />
                    <p className="text-sm font-medium">Scent Sensor Array</p>
                  </div>

                  <div className="space-y-4 w-full">
                    <div className="w-full">
                      <div className="flex justify-between text-xs mb-1">
                        <span>MQ-3</span>
                        <span className="text-xs ml-2">{sensorReadings["MQ-3"]}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-300 rounded-full"
                          style={{ width: `${sensorReadings["MQ-3"]}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Detects alcohol compounds</p>
                    </div>

                    <div className="w-full">
                      <div className="flex justify-between text-xs mb-1">
                        <span>MQ-4</span>
                        <span className="text-xs ml-2">{sensorReadings["MQ-4"]}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-300 rounded-full"
                          style={{ width: `${sensorReadings["MQ-4"]}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Detects methane & hydrocarbons</p>
                    </div>

                    <div className="w-full">
                      <div className="flex justify-between text-xs mb-1">
                        <span>MQ-135</span>
                        <span className="text-xs ml-2">{sensorReadings["MQ-135"]}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-300 rounded-full"
                          style={{ width: `${sensorReadings["MQ-135"]}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Detects VOCs & aromatics</p>
                    </div>
                  </div>
                </div>

                <div className="col-span-2 flex flex-col justify-center items-center">
                  <div className="relative w-40 h-40 mx-auto">
                    <div
                      className="absolute inset-0 rounded-full border-4 border-dashed border-primary/30 animate-spin"
                      style={{ animationDuration: "10s" }}
                    ></div>
                    <div
                      className="absolute inset-4 rounded-full border-4 border-dashed border-primary/50 animate-spin"
                      style={{ animationDuration: "8s", animationDirection: "reverse" }}
                    ></div>
                    <div
                      className="absolute inset-8 rounded-full border-4 border-dashed border-primary/70 animate-spin"
                      style={{ animationDuration: "6s" }}
                    ></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Droplets className="h-12 w-12 text-primary animate-pulse" />
                    </div>
                  </div>
                  <p className="mt-6 text-sm font-medium">Sensing fragrance molecules...</p>
                  <p className="text-xs text-muted-foreground mt-2">Hold your perfume near the sensor</p>
                </div>
              </div>
            </div>

            {/* Progress indicator */}
            <div className="mt-4">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300 rounded-full"
                  style={{ width: `${sensingProgress}%` }}
                ></div>
              </div>
              <p className="text-sm text-muted-foreground mt-2">Sensing... {sensingProgress}%</p>
            </div>
          </div>

          <Button variant="outline" onClick={resetSensor}>
            Cancel
          </Button>
        </div>
      )}

      {sensingState === "processing" && (
        <div className="max-w-md mx-auto text-center py-12 animate-fade-in">
          <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto mb-6" />
          <h2 className="text-2xl font-semibold mb-2">Analyzing Fragrance Profile</h2>
          <p className="text-muted-foreground mb-4">
            Our ML algorithm is processing the sensor data to identify notes, accords, and composition...
          </p>
          <div className="space-y-2 max-w-xs mx-auto text-left">
            <div className="flex justify-between items-center">
              <span className="text-sm">Processing MQ-3 (alcohol content)</span>
              <span className="text-sm text-primary">Complete</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Processing MQ-4 (hydrocarbon gases)</span>
              <span className="text-sm text-primary">Complete</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Processing MQ-135 (VOCs & aromatics)</span>
              <ThumbsUp className="h-4 w-4 text-primary" />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Analyzing molecular composition</span>
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            </div>
          </div>
        </div>
      )}

      {sensingState === "results" && (
        <div className="max-w-5xl mx-auto animate-fade-in">
          <div className="bg-muted/30 p-6 rounded-lg mb-10 text-center">
            <Badge className="mb-4">Match Found!</Badge>
            <h2 className="text-2xl font-semibold mb-2">We've identified your fragrance</h2>
            <p className="text-muted-foreground">
              Based on our sensor analysis, we've found a match in our collection along with similar fragrances you
              might enjoy.
            </p>
          </div>

          {/* Detected scent */}
          <div className="mb-12">
            <h3 className="text-xl font-semibold mb-6 ombre-text">Your Fragrance Match</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="relative aspect-square rounded-lg overflow-hidden">
                <Image
                  src={detectedScent.image || "/placeholder.svg"}
                  alt={detectedScent.name}
                  fill
                  className="object-cover"
                />
                <div className="absolute top-2 right-2">
                  <Badge variant="secondary" className="bg-primary text-white">
                    {detectedScent.similarityScore}% Match
                  </Badge>
                </div>
              </div>

              <div>
                <div className="mb-4">
                  <div className="text-sm text-muted-foreground mb-1">{detectedScent.category}</div>
                  <h2 className="text-3xl font-bold mb-2 ombre-text">{detectedScent.name}</h2>
                  <p className="text-muted-foreground mb-4">{detectedScent.description}</p>
                  <div className="text-2xl font-bold font-ui mb-6 text-foreground dark:text-white">
                    {formatPrice(detectedScent.price)}
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  <div>
                    <h4 className="font-medium mb-2">Top Notes</h4>
                    <div className="flex flex-wrap gap-2">
                      {detectedScent.notes.top.map((note: string) => (
                        <Badge key={note} variant="outline">
                          {note}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Heart Notes</h4>
                    <div className="flex flex-wrap gap-2">
                      {detectedScent.notes.heart.map((note: string) => (
                        <Badge key={note} variant="outline">
                          {note}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Base Notes</h4>
                    <div className="flex flex-wrap gap-2">
                      {detectedScent.notes.base.map((note: string) => (
                        <Badge key={note} variant="outline">
                          {note}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button className="ombre-button" onClick={() => handleAddToCart(detectedScent)}>
                    Add to Cart
                  </Button>
                  <Button
                    variant={isInWishlist(detectedScent.id) ? "default" : "outline"}
                    onClick={() => handleToggleWishlist(detectedScent)}
                  >
                    {isInWishlist(detectedScent.id) ? "In Wishlist" : "Add to Wishlist"}
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href={`/products/${detectedScent.id}`} className="flex items-center">
                      View Details
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Recommended scents */}
          <div>
            <h3 className="text-xl font-semibold mb-6 ombre-text">You Might Also Like</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {recommendedScents.map((scent) => (
                <Card key={scent.id} className="overflow-hidden border-0 shadow-sm hover-lift">
                  <Link href={`/products/${scent.id}`}>
                    <div className="relative aspect-square">
                      <Image
                        src={scent.image || "/placeholder.svg"}
                        alt={scent.name}
                        fill
                        className="object-cover transition-transform hover:scale-105 duration-700"
                      />
                      <div className="absolute top-2 right-2">
                        <Badge variant="secondary" className="bg-primary/80 text-white">
                          {scent.similarityScore}% Similar
                        </Badge>
                      </div>
                    </div>
                  </Link>
                  <CardContent className="pt-4">
                    <Link href={`/products/${scent.id}`} className="hover:underline">
                      <div className="text-sm text-muted-foreground mb-1">{scent.category}</div>
                      <h3 className="font-medium text-lg mb-1 ombre-text">{scent.name}</h3>
                    </Link>
                    <p className="text-sm text-muted-foreground line-clamp-2">{scent.description}</p>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <div className="font-semibold font-ui text-foreground dark:text-white">
                      {formatPrice(scent.price)}
                    </div>
                    <Button
                      size="sm"
                      className="whitespace-nowrap"
                      onClick={() => {
                        addItem({
                          id: scent.id,
                          name: scent.name,
                          price: scent.price,
                          image: scent.image,
                          size: "50ml",
                          quantity: 1,
                        })
                        toast({
                          title: "Added to cart",
                          description: `${scent.name} has been added to your cart.`,
                        })
                      }}
                    >
                      Add to Cart
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>

          <div className="mt-12 text-center flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={resetSensor}>
              <RefreshCw className="mr-2 h-4 w-4" /> Sense Another Fragrance
            </Button>
            <Button variant="outline" asChild>
              <Link href="/products" className="flex items-center">
                Browse All Fragrances
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
