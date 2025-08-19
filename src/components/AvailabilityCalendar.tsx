import { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Calendar as CalendarIcon, Info } from 'lucide-react';
import { format, isSameDay, isWithinInterval, addDays, startOfDay, endOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { BookingService } from '@/services/bookingService';
import { useQuery } from '@tanstack/react-query';

interface AvailabilityCalendarProps {
  propertyId: string;
  selectedCheckIn?: Date;
  selectedCheckOut?: Date;
  onDateSelect?: (checkIn: Date | undefined, checkOut: Date | undefined) => void;
  minimumStay?: number;
  propertyType: 'guest-house' | 'long-term-rental';
  className?: string;
}

interface BookedDate {
  start: Date;
  end: Date;
  status: 'confirmed' | 'pending' | 'blocked';
}

const AvailabilityCalendar = ({
  propertyId,
  selectedCheckIn,
  selectedCheckOut,
  onDateSelect,
  minimumStay = 1,
  propertyType,
  className
}: AvailabilityCalendarProps) => {
  const [selectingCheckOut, setSelectingCheckOut] = useState(false);
  const [hoveredDate, setHoveredDate] = useState<Date>();

  // Récupérer les réservations existantes
  const { data: bookings, isLoading, error } = useQuery({
    queryKey: ['property-availability', propertyId],
    queryFn: () => BookingService.getPropertyBookings(propertyId),
    refetchInterval: 30000 // Actualiser toutes les 30 secondes
  });

  // Transformer les réservations en dates bloquées
  const bookedDates: BookedDate[] = bookings?.map(booking => ({
    start: startOfDay(new Date(booking.checkIn)),
    end: endOfDay(new Date(booking.checkOut)),
    status: booking.status as 'confirmed' | 'pending' | 'blocked'
  })) || [];

  // Vérifier si une date est bloquée
  const isDateBlocked = (date: Date) => {
    const checkDate = startOfDay(date);
    
    return bookedDates.some(bookedDate => 
      isWithinInterval(checkDate, { start: bookedDate.start, end: bookedDate.end }) ||
      isSameDay(checkDate, bookedDate.start) ||
      isSameDay(checkDate, bookedDate.end)
    );
  };

  // Vérifier si une date est en cours de réservation (pending)
  const isDatePending = (date: Date) => {
    const checkDate = startOfDay(date);
    
    return bookedDates.some(bookedDate => 
      bookedDate.status === 'pending' &&
      (isWithinInterval(checkDate, { start: bookedDate.start, end: bookedDate.end }) ||
       isSameDay(checkDate, bookedDate.start) ||
       isSameDay(checkDate, bookedDate.end))
    );
  };

  // Obtenir les dates dans la plage sélectionnée
  const getSelectedRange = () => {
    if (!selectedCheckIn) return [];
    
    const endDate = hoveredDate && selectingCheckOut ? hoveredDate : selectedCheckOut;
    if (!endDate || endDate <= selectedCheckIn) return [selectedCheckIn];

    const dates = [];
    let currentDate = new Date(selectedCheckIn);
    
    while (currentDate <= endDate) {
      dates.push(new Date(currentDate));
      currentDate = addDays(currentDate, 1);
    }
    
    return dates;
  };

  // Vérifier si la sélection est valide
  const isSelectionValid = (checkIn: Date, checkOut?: Date) => {
    if (!checkOut) return true;
    
    // Vérifier la durée minimum
    const daysDiff = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    if (propertyType === 'guest-house' && daysDiff < minimumStay) {
      return false;
    }
    
    // Vérifier qu'aucune date dans la plage n'est bloquée
    let currentDate = new Date(checkIn);
    while (currentDate < checkOut) {
      if (isDateBlocked(currentDate)) {
        return false;
      }
      currentDate = addDays(currentDate, 1);
    }
    
    return true;
  };

  // Gérer la sélection de dates
  const handleDateSelect = (date: Date | undefined) => {
    if (!date || isDateBlocked(date)) return;

    if (!selectedCheckIn || selectingCheckOut) {
      // Sélection de la date d'arrivée ou nouvelle sélection
      setSelectingCheckOut(false);
      onDateSelect?.(date, undefined);
    } else {
      // Sélection de la date de départ
      if (date <= selectedCheckIn) {
        // Si la date est antérieure, recommencer la sélection
        onDateSelect?.(date, undefined);
        setSelectingCheckOut(false);
      } else {
        // Vérifier la validité de la sélection
        if (isSelectionValid(selectedCheckIn, date)) {
          onDateSelect?.(selectedCheckIn, date);
          setSelectingCheckOut(false);
        }
      }
    }
  };

  // Gérer le survol pour prévisualiser la sélection
  const handleDateHover = (date: Date | undefined) => {
    if (selectedCheckIn && !selectedCheckOut && date && date > selectedCheckIn) {
      setHoveredDate(date);
    } else {
      setHoveredDate(undefined);
    }
  };

  // Effet pour activer le mode sélection de checkout
  useEffect(() => {
    if (selectedCheckIn && !selectedCheckOut) {
      setSelectingCheckOut(true);
    }
  }, [selectedCheckIn, selectedCheckOut]);

  // Modifier les classes CSS des dates
  const modifyDay = (date: Date) => {
    const isBlocked = isDateBlocked(date);
    const isPending = isDatePending(date);
    const isSelected = selectedCheckIn && isSameDay(date, selectedCheckIn) ||
                     selectedCheckOut && isSameDay(date, selectedCheckOut);
    const isInRange = getSelectedRange().some(d => isSameDay(d, date));
    const isPast = date < startOfDay(new Date());

    let className = '';
    
    if (isPast) {
      className += ' opacity-50 cursor-not-allowed';
    } else if (isBlocked) {
      className += ' bg-red-100 text-red-800 cursor-not-allowed line-through';
    } else if (isPending) {
      className += ' bg-yellow-100 text-yellow-800 cursor-pointer';
    } else if (isSelected) {
      className += ' bg-primary text-primary-foreground';
    } else if (isInRange) {
      className += ' bg-primary/20 text-primary';
    } else {
      className += ' hover:bg-primary/10 cursor-pointer';
    }

    return className;
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Disponibilités
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Chargement du calendrier...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Disponibilités
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>
              Erreur lors du chargement des disponibilités
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5" />
          Disponibilités
        </CardTitle>
        <CardDescription>
          {selectingCheckOut 
            ? 'Sélectionnez votre date de départ'
            : 'Sélectionnez votre date d\'arrivée'
          }
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Légende */}
        <div className="flex flex-wrap gap-2 text-sm">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-200 rounded"></div>
            <span>Disponible</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-200 rounded"></div>
            <span>Occupé</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-yellow-200 rounded"></div>
            <span>En attente</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-primary/20 rounded"></div>
            <span>Sélectionné</span>
          </div>
        </div>

        {/* Calendrier */}
        <Calendar
          mode="single"
          selected={selectedCheckIn}
          onSelect={handleDateSelect}
          disabled={(date) => date < startOfDay(new Date()) || isDateBlocked(date)}
          modifiers={{
            blocked: (date) => isDateBlocked(date),
            pending: (date) => isDatePending(date),
            selected: (date) => getSelectedRange().some(d => isSameDay(d, date))
          }}
          modifiersClassNames={{
            blocked: 'bg-red-100 text-red-800 line-through cursor-not-allowed',
            pending: 'bg-yellow-100 text-yellow-800',
            selected: 'bg-primary text-primary-foreground'
          }}
          onDayMouseEnter={handleDateHover}
          onDayMouseLeave={() => setHoveredDate(undefined)}
          locale={fr}
          className="rounded-md border"
        />

        {/* Informations sur la sélection */}
        {selectedCheckIn && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                Arrivée: {format(selectedCheckIn, 'PPP', { locale: fr })}
              </Badge>
              {selectedCheckOut && (
                <Badge variant="outline">
                  Départ: {format(selectedCheckOut, 'PPP', { locale: fr })}
                </Badge>
              )}
            </div>
            
            {selectedCheckIn && selectedCheckOut && (
              <div className="text-sm text-gray-600">
                <span>
                  Durée: {Math.ceil((selectedCheckOut.getTime() - selectedCheckIn.getTime()) / (1000 * 60 * 60 * 24))} 
                  {propertyType === 'guest-house' ? ' nuit(s)' : ' jour(s)'}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Informations sur la durée minimum */}
        {minimumStay > 1 && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Durée minimum de séjour : {minimumStay} {propertyType === 'guest-house' ? 'nuit(s)' : 'mois'}
            </AlertDescription>
          </Alert>
        )}

        {/* Message d'erreur si sélection invalide */}
        {selectedCheckIn && hoveredDate && !isSelectionValid(selectedCheckIn, hoveredDate) && (
          <Alert variant="destructive">
            <AlertDescription>
              {Math.ceil((hoveredDate.getTime() - selectedCheckIn.getTime()) / (1000 * 60 * 60 * 24)) < minimumStay
                ? `La durée minimum est de ${minimumStay} ${propertyType === 'guest-house' ? 'nuit(s)' : 'mois'}`
                : 'Certaines dates dans cette période ne sont pas disponibles'
              }
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default AvailabilityCalendar;
