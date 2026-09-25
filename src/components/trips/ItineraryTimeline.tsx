import React from 'react';
import { Clock, MapPin, Plus, Calendar } from 'lucide-react';
import { ItineraryItem } from '../../types/database';
import { Button } from '../common/Button';

interface ItineraryTimelineProps {
  items: ItineraryItem[];
  onOpenAddModal: (day: number) => void;
}

export const ItineraryTimeline: React.FC<ItineraryTimelineProps> = ({ items = [], onOpenAddModal }) => {
  // Group items by day_number
  const daysMap = items.reduce((acc, item) => {
    const day = item.day_number || 1;
    if (!acc[day]) acc[day] = [];
    acc[day].push(item);
    return acc;
  }, {} as Record<number, ItineraryItem[]>);

  const dayNumbers = Object.keys(daysMap)
    .map(Number)
    .sort((a, b) => a - b);

  // If no items, show default Day 1
  if (dayNumbers.length === 0) {
    dayNumbers.push(1);
    daysMap[1] = [];
  }

  return (
    <div className="space-y-6">
      {dayNumbers.map((dayNum) => {
        const dayActivities = daysMap[dayNum] || [];

        return (
          <div key={dayNum} className="rounded-3xl glass-panel p-6 border border-border-subtle">
            <div className="flex items-center justify-between pb-4 border-b border-border-subtle mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center font-display font-extrabold text-sm text-primary">
                  {dayNum}
                </div>
                <h4 className="font-display font-bold text-lg text-white">
                  Day {dayNum} Itinerary
                </h4>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenAddModal(dayNum)}
                icon={<Plus className="w-3.5 h-3.5" />}
              >
                Add Activity
              </Button>
            </div>

            {dayActivities.length === 0 ? (
              <div className="py-6 text-center text-xs text-surface-400">
                <Calendar className="w-6 h-6 mx-auto mb-1 text-surface-500 opacity-60" />
                <span>No activities scheduled for Day {dayNum} yet. Click "Add Activity" to plan your day.</span>
              </div>
            ) : (
              <div className="space-y-3">
                {dayActivities.map((act) => (
                  <div
                    key={act.id}
                    className="p-4 rounded-2xl bg-white/[0.02] border border-border-subtle hover:border-primary/30 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {(act.start_time || act.end_time) && (
                          <span className="text-xs font-bold text-primary flex items-center gap-1 bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                            <Clock className="w-3 h-3" />
                            {act.start_time ? act.start_time.substring(0, 5) : ''}
                            {act.end_time ? ` - ${act.end_time.substring(0, 5)}` : ''}
                          </span>
                        )}
                        <h5 className="font-display font-semibold text-sm text-white">
                          {act.title}
                        </h5>
                      </div>

                      {act.location && (
                        <p className="text-xs text-surface-400 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-gold" />
                          {act.location}
                        </p>
                      )}

                      {act.description && (
                        <p className="text-xs text-surface-300 leading-relaxed max-w-xl">
                          {act.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
