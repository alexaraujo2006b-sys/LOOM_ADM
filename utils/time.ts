
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

export const getShiftEndDate = (shift: ShiftTime, now: Date = new Date()): Date => {
    const [startHour, startMinute] = shift.start.split(':').map(Number);
    const [endHour, endMinute] = shift.end.split(':').map(Number);
    
    const startTime = startHour * 60 + startMinute;
    const endTime = endHour * 60 + endMinute;
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const shiftEnd = new Date(now);
    shiftEnd.setHours(endHour, endMinute, 0, 0);

    // If shift crosses midnight
    if (startTime > endTime) {
        // If we are in the "before midnight" part of the shift
        if (currentTime >= startTime) {
            // The shift ends tomorrow
            shiftEnd.setDate(now.getDate() + 1);
        }
        // If we are in the "after midnight" part, the end is today, which is the default.
    }
    
    return shiftEnd;
}


export const formatDuration = (milliseconds: number): string => {
  if (milliseconds < 0) return "0h 0m";
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
};

export const formatDurationWithSeconds = (milliseconds: number): string => {
  if (milliseconds < 0) return "00:00:00";
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};