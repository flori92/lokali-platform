import { supabase } from '@/lib/supabase';

export interface Review {
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

interface DbReview {
  id: string;
  property_id: string;
  guest_id: string;
  rating: number;
  comment: string;
  helpful_count: number;
  verified: boolean;
  created_at: string;
  updated_at: string;
  users?: {
    id: string;
    name: string;
    avatar_url?: string;
  };
  review_responses?: {
    id: string;
    comment: string;
    created_at: string;
    users: {
      name: string;
    };
  }[];
}

export class ReviewService {
  // Transformer les données de la DB en Review
  private static transformReview(dbReview: DbReview): Review {
    return {
      id: dbReview.id,
      propertyId: dbReview.property_id,
      guestId: dbReview.guest_id,
      guestName: dbReview.users?.name || 'Utilisateur anonyme',
      guestAvatar: dbReview.users?.avatar_url,
      rating: dbReview.rating,
      comment: dbReview.comment,
      createdAt: new Date(dbReview.created_at),
      helpful: dbReview.helpful_count,
      verified: dbReview.verified,
      response: dbReview.review_responses?.[0] ? {
        ownerName: dbReview.review_responses[0].users.name,
        comment: dbReview.review_responses[0].comment,
        createdAt: new Date(dbReview.review_responses[0].created_at)
      } : undefined
    };
  }

  // Récupérer les avis d'une propriété
  static async getPropertyReviews(propertyId: string): Promise<Review[]> {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          users!reviews_guest_id_fkey (
            id,
            name,
            avatar_url
          ),
          review_responses (
            id,
            comment,
            created_at,
            users!review_responses_owner_id_fkey (
              name
            )
          )
        `)
        .eq('property_id', propertyId)
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erreur récupération avis:', error);
        throw new Error(error.message);
      }

      return data?.map(this.transformReview) || [];
    } catch (error) {
      console.error('Erreur service avis:', error);
      throw error;
    }
  }

  // Créer un nouvel avis
  static async createReview(reviewData: {
    propertyId: string;
    guestId: string;
    rating: number;
    comment: string;
  }): Promise<Review> {
    try {
      // Vérifier si l'utilisateur a déjà laissé un avis pour cette propriété
      const { data: existingReview } = await supabase
        .from('reviews')
        .select('id')
        .eq('property_id', reviewData.propertyId)
        .eq('guest_id', reviewData.guestId)
        .single();

      if (existingReview) {
        throw new Error('Vous avez déjà laissé un avis pour cette propriété');
      }

      // Vérifier si l'utilisateur a bien séjourné dans cette propriété
      const { data: booking } = await supabase
        .from('bookings')
        .select('id')
        .eq('property_id', reviewData.propertyId)
        .eq('guest_id', reviewData.guestId)
        .eq('status', 'completed')
        .single();

      const verified = !!booking;

      const { data, error } = await supabase
        .from('reviews')
        .insert({
          property_id: reviewData.propertyId,
          guest_id: reviewData.guestId,
          rating: reviewData.rating,
          comment: reviewData.comment,
          verified,
          status: 'pending' // Modération requise
        })
        .select(`
          *,
          users!reviews_guest_id_fkey (
            id,
            name,
            avatar_url
          )
        `)
        .single();

      if (error) {
        console.error('Erreur création avis:', error);
        throw new Error(error.message);
      }

      // Mettre à jour la note moyenne de la propriété
      await this.updatePropertyRating(reviewData.propertyId);

      return this.transformReview(data);
    } catch (error) {
      console.error('Erreur service création avis:', error);
      throw error;
    }
  }

  // Répondre à un avis (propriétaire)
  static async respondToReview(reviewId: string, ownerId: string, comment: string): Promise<void> {
    try {
      // Vérifier que le propriétaire possède bien la propriété
      const { data: review } = await supabase
        .from('reviews')
        .select(`
          property_id,
          properties!inner (
            owner_id
          )
        `)
        .eq('id', reviewId)
        .single();

      if (!review || review.properties.owner_id !== ownerId) {
        throw new Error('Non autorisé à répondre à cet avis');
      }

      const { error } = await supabase
        .from('review_responses')
        .insert({
          review_id: reviewId,
          owner_id: ownerId,
          comment
        });

      if (error) {
        console.error('Erreur réponse avis:', error);
        throw new Error(error.message);
      }
    } catch (error) {
      console.error('Erreur service réponse avis:', error);
      throw error;
    }
  }

  // Marquer un avis comme utile
  static async markReviewHelpful(reviewId: string, userId: string): Promise<void> {
    try {
      // Vérifier si l'utilisateur a déjà marqué cet avis comme utile
      const { data: existing } = await supabase
        .from('review_helpful')
        .select('id')
        .eq('review_id', reviewId)
        .eq('user_id', userId)
        .single();

      if (existing) {
        // Retirer le vote utile
        await supabase
          .from('review_helpful')
          .delete()
          .eq('review_id', reviewId)
          .eq('user_id', userId);
      } else {
        // Ajouter le vote utile
        await supabase
          .from('review_helpful')
          .insert({
            review_id: reviewId,
            user_id: userId
          });
      }

      // Mettre à jour le compteur
      const { data: count } = await supabase
        .from('review_helpful')
        .select('id', { count: 'exact' })
        .eq('review_id', reviewId);

      await supabase
        .from('reviews')
        .update({ helpful_count: count?.length || 0 })
        .eq('id', reviewId);

    } catch (error) {
      console.error('Erreur service vote utile:', error);
      throw error;
    }
  }

  // Signaler un avis
  static async reportReview(reviewId: string, userId: string, reason: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('review_reports')
        .insert({
          review_id: reviewId,
          reporter_id: userId,
          reason,
          status: 'pending'
        });

      if (error) {
        console.error('Erreur signalement avis:', error);
        throw new Error(error.message);
      }
    } catch (error) {
      console.error('Erreur service signalement avis:', error);
      throw error;
    }
  }

  // Calculer les statistiques d'avis pour une propriété
  static async getPropertyReviewStats(propertyId: string): Promise<{
    averageRating: number;
    totalReviews: number;
    ratingDistribution: Record<number, number>;
  }> {
    try {
      const { data: reviews, error } = await supabase
        .from('reviews')
        .select('rating')
        .eq('property_id', propertyId)
        .eq('status', 'approved');

      if (error) {
        throw new Error(error.message);
      }

      const totalReviews = reviews?.length || 0;
      const averageRating = totalReviews > 0 
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews 
        : 0;

      const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      reviews?.forEach(review => {
        ratingDistribution[review.rating]++;
      });

      return {
        averageRating,
        totalReviews,
        ratingDistribution
      };
    } catch (error) {
      console.error('Erreur statistiques avis:', error);
      throw error;
    }
  }

  // Mettre à jour la note moyenne d'une propriété
  private static async updatePropertyRating(propertyId: string): Promise<void> {
    try {
      const stats = await this.getPropertyReviewStats(propertyId);
      
      await supabase
        .from('properties')
        .update({
          rating_average: stats.averageRating,
          rating_count: stats.totalReviews
        })
        .eq('id', propertyId);
    } catch (error) {
      console.error('Erreur mise à jour note propriété:', error);
    }
  }

  // Récupérer les avis en attente de modération
  static async getPendingReviews(): Promise<Review[]> {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          users!reviews_guest_id_fkey (
            id,
            name,
            avatar_url
          ),
          properties (
            title,
            city
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return data?.map(this.transformReview) || [];
    } catch (error) {
      console.error('Erreur récupération avis en attente:', error);
      throw error;
    }
  }

  // Modérer un avis (approuver/rejeter)
  static async moderateReview(reviewId: string, status: 'approved' | 'rejected', moderatorId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('reviews')
        .update({ 
          status,
          moderated_by: moderatorId,
          moderated_at: new Date().toISOString()
        })
        .eq('id', reviewId);

      if (error) {
        throw new Error(error.message);
      }

      // Si approuvé, mettre à jour la note de la propriété
      if (status === 'approved') {
        const { data: review } = await supabase
          .from('reviews')
          .select('property_id')
          .eq('id', reviewId)
          .single();

        if (review) {
          await this.updatePropertyRating(review.property_id);
        }
      }
    } catch (error) {
      console.error('Erreur modération avis:', error);
      throw error;
    }
  }
}
