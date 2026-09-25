import React, { useState } from 'react';
import { X, Clock, MapPin, Plus } from 'lucide-react';
import { Button } from '../common/Button';

interface AddActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (activity: {
    day_number: number;
    title: string;
    description: string;
    location: string;
    start_time: string;
    end_time: string;
  }) => Promise<void>;
  defaultDay?: number;
}

export const AddActivityModal: React.FC<AddActivityModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  defaultDay = 1,
}) => {
  const [dayNumber, setDayNumber] = useState(defaultDay);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('11:30');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    setLoading(true);
    try {
      await onAdd({
        day_number: Number(dayNumber),
        title,
        description,
        location,
        start_time: startTime,
        end_time: endTime,
      });
      setTitle('');
      setDescription('');
      setLocation('');
      onClose();
    } catch (err) {
      console.error('[AddActivityModal] Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl glass-panel p-6 sm:p-8 border border-border-strong shadow-2xl">
        
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/[0.05] border border-border-subtle flex items-center justify-center text-surface-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <h3 className="font-display font-bold text-xl text-white mb-4">Add Day Excursion</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-surface-400 mb-1">
                Day Number
              </label>
              <input
                type="number"
                min={1}
                max={30}
                required
                value={dayNumber}
                onChange={(e) => setDayNumber(Number(e.target.value))}
                className="w-full bg-white/[0.04] border border-border-subtle rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-surface-400 mb-1 flex items-center gap-1">
                <Clock className="w-3 h-3 text-primary" /> Start
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-white/[0.04] border border-border-subtle rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-surface-400 mb-1 flex items-center gap-1">
                <Clock className="w-3 h-3 text-primary" /> End
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full bg-white/[0.04] border border-border-subtle rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-surface-400 mb-1">
              Activity Title
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Private Yacht Charter to Capri"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-white/[0.04] border border-border-subtle rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-surface-500 focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-surface-400 mb-1 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-primary" /> Location / Sanctuary
            </label>
            <input
              type="text"
              placeholder="e.g. Positano Marina Pier 2"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full bg-white/[0.04] border border-border-subtle rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-surface-500 focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-surface-400 mb-1">
              Curator Notes / Details
            </label>
            <textarea
              rows={2}
              placeholder="Private skipper, champagne included, swimsuit recommended..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-white/[0.04] border border-border-subtle rounded-xl px-4 py-2 text-sm text-white placeholder:text-surface-500 focus:outline-none focus:border-primary resize-none"
            />
          </div>

          <div className="pt-2">
            <Button type="submit" variant="primary" size="md" isLoading={loading} className="w-full" icon={<Plus className="w-4 h-4" />}>
              Add to Itinerary
            </Button>
          </div>
        </form>

      </div>
    </div>
  );
};
