import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, ThumbsUp, Flag, User } from 'lucide-react';

interface Review {
  id: string;
  propertyId: string;
  guestId: string;
  guestName: string;
  guestAvatar?: string;
  rating: number;
  comment: string;
  createdAt: Date;
  helpful: number;
  verified: boolean;
  response?: {
    ownerName: string;
    comment: string;
    createdAt: Date;
  };
}

interface ReviewSystemProps {
  propertyId: string;
  reviews: Review[];
  averageRating: number;
  totalReviews: number;
  canReview?: boolean;
  onSubmitReview?: (rating: number, comment: string) => Promise<void>;
  onReportReview?: (reviewId: string) => void;
  onMarkHelpful?: (reviewId: string) => void;
}

const StarRating: React.FC<{
  rating: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onChange?: (rating: number) => void;
}> = ({ rating, size = 'md', interactive = false, onChange }) => {
  const [hoverRating, setHoverRating] = useState(0);
  
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${sizeClasses[size]} ${
            star <= (hoverRating || rating)
              ? 'fill-yellow-400 text-yellow-400'
              : 'text-gray-300'
          } ${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : ''}`}
          onClick={() => interactive && onChange?.(star)}
          onMouseEnter={() => interactive && setHoverRating(star)}
          onMouseLeave={() => interactive && setHoverRating(0)}
        />
      ))}
    </div>
  );
};

const ReviewForm: React.FC<{
  onSubmit: (rating: number, comment: string) => Promise<void>;
  onCancel: () => void;
}> = ({ onSubmit, onCancel }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;

    setIsSubmitting(true);
    try {
      await onSubmit(rating, comment);
      setRating(0);
      setComment('');
      onCancel();
    } catch (error) {
      console.error('Erreur soumission avis:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-2 border-blue-200">
      <CardHeader>
        <CardTitle className="text-lg">Laisser un avis</CardTitle>
        <CardDescription>
          Partagez votre expérience pour aider d'autres voyageurs
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Note générale *
            </label>
            <StarRating
              rating={rating}
              size="lg"
              interactive
              onChange={setRating}
            />
            {rating > 0 && (
              <p className="text-sm text-gray-600 mt-1">
                {rating === 1 && "Très décevant"}
                {rating === 2 && "Décevant"}
                {rating === 3 && "Correct"}
                {rating === 4 && "Très bien"}
                {rating === 5 && "Excellent"}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Commentaire (optionnel)
            </label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Décrivez votre expérience..."
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">
              {comment.length}/500 caractères
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={rating === 0 || isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? 'Publication...' : 'Publier l\'avis'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

const ReviewCard: React.FC<{
  review: Review;
  onMarkHelpful?: (reviewId: string) => void;
  onReport?: (reviewId: string) => void;
}> = ({ review, onMarkHelpful, onReport }) => {
  return (
    <Card className="mb-4">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={review.guestAvatar} />
              <AvatarFallback>
                <User className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-medium">{review.guestName}</h4>
                {review.verified && (
                  <Badge variant="secondary" className="text-xs">
                    Séjour vérifié
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <StarRating rating={review.rating} size="sm" />
                <span className="text-sm text-gray-500">
                  {review.createdAt.toLocaleDateString('fr-FR')}
                </span>
              </div>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onReport?.(review.id)}
            className="text-gray-400 hover:text-gray-600"
          >
            <Flag className="h-4 w-4" />
          </Button>
        </div>

        {review.comment && (
          <p className="text-gray-700 mb-4 leading-relaxed">
            {review.comment}
          </p>
        )}

        {review.response && (
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-xs">
                Réponse du propriétaire
              </Badge>
              <span className="text-sm text-gray-500">
                {review.response.createdAt.toLocaleDateString('fr-FR')}
              </span>
            </div>
            <p className="text-sm text-gray-700">
              {review.response.comment}
            </p>
          </div>
        )}

        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onMarkHelpful?.(review.id)}
            className="text-gray-500 hover:text-gray-700"
          >
            <ThumbsUp className="h-4 w-4 mr-1" />
            Utile ({review.helpful})
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const ReviewSystem: React.FC<ReviewSystemProps> = ({
  propertyId,
  reviews,
  averageRating,
  totalReviews,
  canReview = false,
  onSubmitReview,
  onReportReview,
  onMarkHelpful
}) => {
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [sortBy, setSortBy] = useState<'recent' | 'rating' | 'helpful'>('recent');

  const getRatingDistribution = () => {
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(review => {
      distribution[review.rating as keyof typeof distribution]++;
    });
    return distribution;
  };

  const getSortedReviews = () => {
    const sorted = [...reviews];
    switch (sortBy) {
      case 'rating':
        return sorted.sort((a, b) => b.rating - a.rating);
      case 'helpful':
        return sorted.sort((a, b) => b.helpful - a.helpful);
      case 'recent':
      default:
        return sorted.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
  };

  const distribution = getRatingDistribution();
  const sortedReviews = getSortedReviews();

  return (
    <div className="space-y-6">
      {/* En-tête avec statistiques */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Avis des voyageurs</CardTitle>
              <CardDescription>
                {totalReviews} avis • Note moyenne {averageRating.toFixed(1)}/5
              </CardDescription>
            </div>
            {canReview && !showReviewForm && (
              <Button onClick={() => setShowReviewForm(true)}>
                Laisser un avis
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Note moyenne */}
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900 mb-2">
                {averageRating.toFixed(1)}
              </div>
              <StarRating rating={Math.round(averageRating)} size="lg" />
              <p className="text-sm text-gray-600 mt-2">
                Basé sur {totalReviews} avis
              </p>
            </div>

            {/* Distribution des notes */}
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = distribution[rating as keyof typeof distribution];
                const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                
                return (
                  <div key={rating} className="flex items-center gap-2">
                    <span className="text-sm font-medium w-8">{rating}★</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600 w-8">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Formulaire d'avis */}
      {showReviewForm && onSubmitReview && (
        <ReviewForm
          onSubmit={onSubmitReview}
          onCancel={() => setShowReviewForm(false)}
        />
      )}

      {/* Filtres et tri */}
      {reviews.length > 0 && (
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            Tous les avis ({reviews.length})
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Trier par :</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              <option value="recent">Plus récents</option>
              <option value="rating">Note</option>
              <option value="helpful">Plus utiles</option>
            </select>
          </div>
        </div>
      )}

      {/* Liste des avis */}
      <div>
        {sortedReviews.length > 0 ? (
          sortedReviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              onMarkHelpful={onMarkHelpful}
              onReport={onReportReview}
            />
          ))
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Aucun avis pour le moment
              </h3>
              <p className="text-gray-600">
                Soyez le premier à partager votre expérience
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ReviewSystem;
