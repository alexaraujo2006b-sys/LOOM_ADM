
import { ShiftTime } from '../types';

export const getCurrentShift = (shifts: ShiftTime[], now: Date = new Date()): ShiftTime | null => {
  const currentTime = now.getHours() * 60 + now.getMinutes();

  for (const shift of shifts) {
    const [startHour, startMinute] = shift.start.split(':').map(Number);
    const [endHour, endMinute] = shift.end.split(':').map(Number);
    const startTime = startHour * 60 + startMinute;
    const endTime = endHour * 60 + endMinute;

    if (startTime > endTime) { // Shift crosses midnight
      if (currentTime >= startTime || currentTime < endTime) {
        return shift;
      }
    } else { // Shift within the same day
      if (currentTime >= startTime && currentTime < endTime) {
        return shift;
      }
    }
  }

  return null;
};

export const getShiftStartDate = (shift: ShiftTime, now: Date = new Date()): Date => {
    const [startHour, startMinute] = shift.start.split(':').map(Number);
    const [endHour, endMinute] = shift.end.split(':').map(Number);
    
    const startTime = startHour * 60 + startMinute;
    const endTime = endHour * 60 + endMinute;
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const shiftStart = new Date(now);
    shiftStart.setHours(startHour, startMinute, 0, 0);

    if (startTime > endTime && currentTime < endTime) {
        // This is the part of the shift that started yesterday
        shiftStart.setDate(now.getDate() - 1);
    }
    
    return shiftStart;
}

export const formatDuration = (milliseconds: number): string => {
  if (milliseconds < 0) return "0h 0m";
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
};
