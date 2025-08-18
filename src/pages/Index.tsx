import Header from "@/components/Header";
import SearchBar from "@/components/SearchBar";
import PropertyCard from "@/components/PropertyCard";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-image.jpg";
import property1 from "@/assets/property-1.jpg";
import property2 from "@/assets/property-2.jpg";
import property3 from "@/assets/property-3.jpg";
import property4 from "@/assets/property-4.jpg";

const Index = () => {
  const featuredProperties = [
    {
      id: "1",
      title: "Chalet de montagne luxueux",
      location: "Chamonix, France",
      price: 280,
      rating: 4.9,
      reviews: 127,
      image: property1,
      isLiked: true
    },
    {
      id: "2", 
      title: "Villa moderne vue mer",
      location: "Nice, France",
      price: 420,
      rating: 4.8,
      reviews: 89,
      image: property2
    },
    {
      id: "3",
      title: "Cottage champêtre authentique",
      location: "Provence, France", 
      price: 180,
      rating: 4.7,
      reviews: 156,
      image: property3
    },
    {
      id: "4",
      title: "Loft urbain design",
      location: "Paris, France",
      price: 350,
      rating: 4.9,
      reviews: 203,
      image: property4,
      isLiked: true
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
            Trouvez votre refuge parfait
          </h1>
          <p className="text-xl md:text-2xl mb-8 opacity-90">
            Découvrez des hébergements uniques partout dans le monde
          </p>
          
          <div className="mt-8">
            <SearchBar />
          </div>
        </div>
      </section>

      {/* Popular Destinations */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Hébergements populaires
            </h2>
            <p className="text-lg text-muted-foreground">
              Découvrez les guest houses les mieux notées par nos voyageurs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProperties.map((property) => (
              <PropertyCard key={property.id} {...property} />
            ))}
          </div>

          <div className="text-center mt-12">
            <Button variant="hero" size="lg">
              Voir tous les hébergements
            </Button>
          </div>
        </div>
      </section>

      {/* Host Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
            Devenez hôte sur StayNest
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Partagez votre espace et commencez à gagner de l'argent en tant qu'hôte.
          </p>
          <Button variant="hero" size="lg">
            Devenir hôte
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Index;
