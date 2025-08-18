import Header from "@/components/Header";
import SearchBar from "@/components/SearchBar";
import PropertyCard from "@/components/PropertyCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import heroImage from "@/assets/hero-image.jpg";
import property1 from "@/assets/property-1.jpg";
import property2 from "@/assets/property-2.jpg";
import property3 from "@/assets/property-3.jpg";
import property4 from "@/assets/property-4.jpg";
import { Property } from "@/types/property";

const Index = () => {
  const guestHouses = [
    {
      id: "1",
      title: "Guest House Moderne Cotonou",
      location: "Fidjrossè, Cotonou",
      price: 25000,
      rating: 4.8,
      reviews: 45,
      image: property1,
      isLiked: true,
      type: "guest-house" as const
    },
    {
      id: "2", 
      title: "Villa Familiale Akpakpa",
      location: "Akpakpa, Cotonou",
      price: 35000,
      rating: 4.9,
      reviews: 32,
      image: property2,
      type: "guest-house" as const
    }
  ];

  const longTermRentals = [
    {
      id: "3",
      title: "Appartement 2 Chambres Vide",
      location: "Jéricho, Cotonou", 
      price: 85000,
      rating: 4.6,
      reviews: 18,
      image: property3,
      type: "long-term-rental" as const
    },
    {
      id: "4",
      title: "Studio Moderne Non Meublé",
      location: "Porto-Novo Centre",
      price: 45000,
      rating: 4.7,
      reviews: 23,
      image: property4,
      isLiked: true,
      type: "long-term-rental" as const
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative h-[80vh] flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-overlay" />
        
        <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Trouvez votre logement local
          </h1>
          <p className="text-xl md:text-2xl mb-8 opacity-90">
            Guest houses et locations longue durée au Bénin, sans intermédiaires
          </p>
          
          <div className="mt-8">
            <SearchBar />
          </div>
        </div>
      </section>

      {/* Property Types Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Nos Services de Location
            </h2>
            <p className="text-lg text-muted-foreground">
              Choisissez entre nos guest houses ou nos locations longue durée
            </p>
          </div>

          <Tabs defaultValue="guest-houses" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="guest-houses">Guest Houses</TabsTrigger>
              <TabsTrigger value="long-term">Locations Longue Durée</TabsTrigger>
            </TabsList>
            
            <TabsContent value="guest-houses">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-semibold mb-2">Guest Houses</h3>
                <p className="text-muted-foreground">Hébergements de courte durée pour vos séjours</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                {guestHouses.map((property) => (
                  <PropertyCard key={property.id} {...property} />
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="long-term">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-semibold mb-2">Locations Longue Durée</h3>
                <p className="text-muted-foreground">Appartements vides à aménager selon vos goûts</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                {longTermRentals.map((property) => (
                  <PropertyCard key={property.id} {...property} />
                ))}
              </div>
            </TabsContent>
          </Tabs>

          <div className="text-center mt-12">
            <Button variant="hero" size="lg">
              Voir toutes les propriétés
            </Button>
          </div>
        </div>
      </section>

      {/* Owner Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              Propriétaires, louez sans intermédiaires
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Mettez votre bien en location directement et évitez les frais d'agence
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold mb-4">Avantages pour les propriétaires</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Aucun frais d'intermédiation</li>
                <li>• Contact direct avec les locataires</li>
                <li>• Gestion simplifiée des visites</li>
                <li>• Paiements sécurisés en FCFA</li>
              </ul>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold mb-4">Avantages pour les locataires</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Pas de frais de visite</li>
                <li>• Négociation directe des prix</li>
                <li>• Transparence totale</li>
                <li>• Réservation immédiate</li>
              </ul>
            </div>
          </div>
          
          <div className="text-center">
            <Button variant="hero" size="lg">
              Publier mon bien
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
