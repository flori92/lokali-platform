import { Heart, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PropertyType } from "@/types/property";
import { Link } from "react-router-dom";

interface PropertyCardProps {
  id: string;
  title: string;
  location: string;
  price: number;
  rating: number;
  reviews: number;
  image: string;
  isLiked?: boolean;
  type?: PropertyType;
}

const PropertyCard = ({ id, title, location, price, rating, reviews, image, isLiked = false, type }: PropertyCardProps) => {
  return (
    <Link to={`/property/${id}`} className="group cursor-pointer block">
      <div className="relative overflow-hidden rounded-lg aspect-square mb-3">
        <img 
          src={image} 
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-overlay opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute top-3 right-3 bg-background/80 backdrop-blur-sm hover:bg-background"
        >
          <Heart className={`h-4 w-4 ${isLiked ? 'fill-primary text-primary' : 'text-foreground'}`} />
        </Button>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
            {title}
          </h3>
          <div className="flex items-center space-x-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium">{rating}</span>
            <span className="text-sm text-muted-foreground">({reviews})</span>
          </div>
        </div>
        
        <p className="text-muted-foreground">{location}</p>
        
        <div className="flex items-baseline space-x-1">
          <span className="font-semibold text-foreground">{price.toLocaleString()} CFA</span>
          <span className="text-muted-foreground text-sm">
            {type === 'guest-house' ? 'par nuit' : 'par mois'}
          </span>
        </div>
      </div>
    </Link>
  );
};

export default PropertyCard;