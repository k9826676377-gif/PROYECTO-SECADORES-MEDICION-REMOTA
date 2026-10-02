import { MeasurementPoint, PointType } from '../types';

export interface PointCoordinate {
  x: number;
  y: number;
  radius: number;
}

// Complete coordinate map for all 162 measurement points across Areas 1, 2, and 3
export const SCHEMATIC_COORDINATES: Record<string, PointCoordinate> = {
  // ================= AREA 1 (52 points) =================
  // Secadores 1 al 16 (16)
  'pt-1s-01': { x: 1100, y: 235, radius: 46 },
  'pt-1s-02': { x: 1040, y: 345, radius: 46 },
  'pt-1s-03': { x: 965, y: 235, radius: 46 },
  'pt-1s-04': { x: 910, y: 345, radius: 46 },
  'pt-1s-05': { x: 835, y: 235, radius: 46 },
  'pt-1s-06': { x: 775, y: 345, radius: 46 },
  'pt-1s-07': { x: 700, y: 235, radius: 46 },
  'pt-1s-08': { x: 645, y: 345, radius: 46 },
  'pt-1s-09': { x: 570, y: 235, radius: 46 },
  'pt-1s-10': { x: 515, y: 345, radius: 46 },
  'pt-1s-11': { x: 440, y: 235, radius: 46 },
  'pt-1s-12': { x: 380, y: 345, radius: 46 },
  'pt-1s-13': { x: 305, y: 235, radius: 46 },
  'pt-1s-14': { x: 250, y: 345, radius: 46 },
  'pt-1s-15': { x: 175, y: 235, radius: 46 },
  'pt-1s-16': { x: 115, y: 345, radius: 46 },

  // Piñones Area 1 (7)
  'pt-1p-aa': { x: 1100, y: 255, radius: 18 },
  'pt-1p-a': { x: 635, y: 265, radius: 18 },
  'pt-1p-b': { x: 575, y: 265, radius: 18 },
  'pt-1p-c': { x: 510, y: 265, radius: 18 },
  'pt-1p-i': { x: 470, y: 265, radius: 18 },
  'pt-1p-ii': { x: 410, y: 265, radius: 18 },
  'pt-1p-iii': { x: 350, y: 265, radius: 18 },

  // Rodillos de bolsillo Area 1 (17)
  'pt-1r-03a': { x: 890, y: 265, radius: 14 },
  'pt-1r-03b': { x: 760, y: 265, radius: 14 },
  'pt-1r-04a': { x: 630, y: 265, radius: 14 },
  'pt-1r-04b': { x: 505, y: 265, radius: 14 },
  'pt-1r-05a': { x: 410, y: 265, radius: 14 },
  'pt-1r-05b': { x: 350, y: 280, radius: 14 },
  'pt-1r-06a': { x: 245, y: 265, radius: 14 },
  'pt-1r-06b': { x: 110, y: 265, radius: 14 },
  'pt-1r-07a': { x: 960, y: 310, radius: 14 },
  'pt-1r-07b': { x: 830, y: 310, radius: 14 },
  'pt-1r-08a': { x: 700, y: 310, radius: 14 },
  'pt-1r-08b': { x: 575, y: 310, radius: 14 },
  'pt-1r-09a': { x: 445, y: 360, radius: 14 },
  'pt-1r-09b': { x: 435, y: 310, radius: 14 },
  'pt-1r-10a': { x: 310, y: 310, radius: 14 },
  'pt-1r-10b': { x: 180, y: 310, radius: 14 },
  'pt-1r-11a': { x: 45, y: 330, radius: 14 },

  // Rodillos de retorno / superior Area 1 (12)
  'pt-1r-01a': { x: 1255, y: 215, radius: 14 },
  'pt-1r-01b': { x: 1090, y: 95, radius: 14 },
  'pt-1r-01c': { x: 910, y: 115, radius: 14 },
  'pt-1r-01d': { x: 780, y: 95, radius: 14 },
  'pt-1r-01e': { x: 675, y: 65, radius: 14 },
  'pt-1r-01f': { x: 470, y: 70, radius: 14 },
  'pt-1r-02a': { x: 520, y: 95, radius: 14 },
  'pt-1r-02b': { x: 375, y: 125, radius: 14 },
  'pt-1r-02c': { x: 100, y: 125, radius: 14 },
  'pt-1r-02d': { x: 285, y: 65, radius: 14 },
  'pt-1r-02e': { x: 225, y: 70, radius: 14 },
  'pt-1r-02f': { x: 130, y: 60, radius: 14 },

  // ================= AREA 2 (43 points) =================
  // Secadores 17 al 23 (7)
  'pt-2s-17': { x: 960, y: 235, radius: 46 },
  'pt-2s-18': { x: 890, y: 345, radius: 46 },
  'pt-2s-19': { x: 820, y: 235, radius: 46 },
  'pt-2s-20': { x: 750, y: 345, radius: 46 },
  'pt-2s-21': { x: 680, y: 235, radius: 46 },
  'pt-2s-22': { x: 610, y: 345, radius: 46 },
  'pt-2s-23': { x: 540, y: 235, radius: 46 },

  // Piñones Area 2: P-IV al P-IX (6)
  'pt-2p-iv': { x: 925, y: 285, radius: 18 },
  'pt-2p-v': { x: 855, y: 285, radius: 18 },
  'pt-2p-vi': { x: 785, y: 285, radius: 18 },
  'pt-2p-vii': { x: 715, y: 285, radius: 18 },
  'pt-2p-viii': { x: 645, y: 285, radius: 18 },
  'pt-2p-ix': { x: 575, y: 285, radius: 18 },

  // Rodillos de bolsillo Area 2 (13)
  'pt-2r-30': { x: 890, y: 265, radius: 14 },
  'pt-2r-31': { x: 750, y: 265, radius: 14 },
  'pt-2r-32': { x: 610, y: 265, radius: 14 },
  'pt-2r-33': { x: 470, y: 265, radius: 14 },
  'pt-2r-21': { x: 820, y: 310, radius: 14 },
  'pt-2r-22': { x: 680, y: 310, radius: 14 },
  'pt-2r-47': { x: 540, y: 310, radius: 14 },
  'pt-2r-48': { x: 400, y: 330, radius: 14 },
  'pt-2r-49': { x: 960, y: 310, radius: 14 },
  'pt-2r-66': { x: 1025, y: 265, radius: 14 },
  'pt-2r-67': { x: 1060, y: 320, radius: 14 },
  'pt-2r-76': { x: 340, y: 280, radius: 14 },
  'pt-2r-77': { x: 280, y: 330, radius: 14 },

  // Rodillos de retorno / superior Area 2 (17)
  'pt-2r-26': { x: 1050, y: 110, radius: 14 },
  'pt-2r-27': { x: 960, y: 80, radius: 14 },
  'pt-2r-28': { x: 860, y: 80, radius: 14 },
  'pt-2r-29': { x: 760, y: 80, radius: 14 },
  'pt-2r-18': { x: 660, y: 80, radius: 14 },
  'pt-2r-19': { x: 560, y: 80, radius: 14 },
  'pt-2r-20': { x: 460, y: 110, radius: 14 },
  'pt-2r-43': { x: 380, y: 95, radius: 14 },
  'pt-2r-44': { x: 300, y: 115, radius: 14 },
  'pt-2r-45': { x: 220, y: 140, radius: 14 },
  'pt-2r-46': { x: 160, y: 180, radius: 14 },
  'pt-2r-63': { x: 1080, y: 410, radius: 14 },
  'pt-2r-64': { x: 980, y: 410, radius: 14 },
  'pt-2r-65': { x: 880, y: 410, radius: 14 },
  'pt-2r-73': { x: 780, y: 410, radius: 14 },
  'pt-2r-74': { x: 680, y: 410, radius: 14 },
  'pt-2r-75': { x: 580, y: 410, radius: 14 },

  // ================= AREA 3 (67 points) =================
  // Secadores 23A al 38 (16)
  'pt-3s-23a': { x: 1100, y: 235, radius: 46 },
  'pt-3s-24': { x: 1040, y: 345, radius: 46 },
  'pt-3s-25': { x: 965, y: 235, radius: 46 },
  'pt-3s-26': { x: 910, y: 345, radius: 46 },
  'pt-3s-27': { x: 835, y: 235, radius: 46 },
  'pt-3s-28': { x: 775, y: 345, radius: 46 },
  'pt-3s-29': { x: 700, y: 235, radius: 46 },
  'pt-3s-30': { x: 645, y: 345, radius: 46 },
  'pt-3s-31': { x: 570, y: 235, radius: 46 },
  'pt-3s-32': { x: 515, y: 345, radius: 46 },
  'pt-3s-33': { x: 440, y: 235, radius: 46 },
  'pt-3s-34': { x: 380, y: 345, radius: 46 },
  'pt-3s-35': { x: 305, y: 235, radius: 46 },
  'pt-3s-36': { x: 250, y: 345, radius: 46 },
  'pt-3s-37': { x: 175, y: 235, radius: 46 },
  'pt-3s-38': { x: 115, y: 345, radius: 46 },

  // Piñones Area 3: P-X al P-XXIX (20)
  'pt-3p-x': { x: 1070, y: 275, radius: 18 },
  'pt-3p-xi': { x: 1021, y: 295, radius: 18 },
  'pt-3p-xii': { x: 973, y: 275, radius: 18 },
  'pt-3p-xiii': { x: 924, y: 295, radius: 18 },
  'pt-3p-xiv': { x: 875, y: 275, radius: 18 },
  'pt-3p-xv': { x: 827, y: 295, radius: 18 },
  'pt-3p-xvi': { x: 778, y: 275, radius: 18 },
  'pt-3p-xvii': { x: 729, y: 295, radius: 18 },
  'pt-3p-xviii': { x: 681, y: 275, radius: 18 },
  'pt-3p-xix': { x: 632, y: 295, radius: 18 },
  'pt-3p-xx': { x: 583, y: 275, radius: 18 },
  'pt-3p-xxi': { x: 535, y: 295, radius: 18 },
  'pt-3p-xxii': { x: 486, y: 275, radius: 18 },
  'pt-3p-xxiii': { x: 437, y: 295, radius: 18 },
  'pt-3p-xxiv': { x: 389, y: 275, radius: 18 },
  'pt-3p-xxv': { x: 340, y: 295, radius: 18 },
  'pt-3p-xxvi': { x: 291, y: 275, radius: 18 },
  'pt-3p-xxvii': { x: 243, y: 295, radius: 18 },
  'pt-3p-xxviii': { x: 194, y: 275, radius: 18 },
  'pt-3p-xxix': { x: 145, y: 295, radius: 18 },

  // Rodillos de bolsillo Area 3 (15)
  'pt-3r-58': { x: 1010, y: 265, radius: 14 },
  'pt-3r-59': { x: 875, y: 265, radius: 14 },
  'pt-3r-60': { x: 740, y: 265, radius: 14 },
  'pt-3r-61': { x: 605, y: 265, radius: 14 },
  'pt-3r-62': { x: 470, y: 265, radius: 14 },
  'pt-3r-63': { x: 335, y: 265, radius: 14 },
  'pt-3r-64': { x: 200, y: 265, radius: 14 },
  'pt-3r-76': { x: 1070, y: 315, radius: 14 },
  'pt-3r-77': { x: 940, y: 315, radius: 14 },
  'pt-3r-78': { x: 810, y: 315, radius: 14 },
  'pt-3r-79': { x: 680, y: 315, radius: 14 },
  'pt-3r-80': { x: 550, y: 315, radius: 14 },
  'pt-3r-81': { x: 420, y: 315, radius: 14 },
  'pt-3r-82': { x: 290, y: 315, radius: 14 },
  'pt-3r-83': { x: 160, y: 315, radius: 14 },

  // Rodillos de retorno / superior Area 3 (16)
  'pt-3r-50': { x: 1120, y: 80, radius: 14 },
  'pt-3r-51': { x: 990, y: 110, radius: 14 },
  'pt-3r-52': { x: 860, y: 80, radius: 14 },
  'pt-3r-53': { x: 730, y: 110, radius: 14 },
  'pt-3r-54': { x: 600, y: 80, radius: 14 },
  'pt-3r-55': { x: 470, y: 110, radius: 14 },
  'pt-3r-56': { x: 340, y: 80, radius: 14 },
  'pt-3r-57': { x: 210, y: 110, radius: 14 },
  'pt-3r-68': { x: 1100, y: 415, radius: 14 },
  'pt-3r-69': { x: 970, y: 430, radius: 14 },
  'pt-3r-70': { x: 840, y: 415, radius: 14 },
  'pt-3r-71': { x: 710, y: 430, radius: 14 },
  'pt-3r-72': { x: 580, y: 415, radius: 14 },
  'pt-3r-73': { x: 450, y: 430, radius: 14 },
  'pt-3r-74': { x: 320, y: 415, radius: 14 },
  'pt-3r-75': { x: 190, y: 430, radius: 14 },
};

/**
 * Returns guaranteed coordinates for any measurement point.
 */
export function getPointCoordinates(p: MeasurementPoint): PointCoordinate {
  if (p.coordinates && typeof p.coordinates.x === 'number' && typeof p.coordinates.y === 'number') {
    return {
      x: p.coordinates.x,
      y: p.coordinates.y,
      radius: p.coordinates.radius || (p.type === 'dryer' ? 46 : p.type === 'pinion' ? 18 : 14)
    };
  }

  // Lookup by ID
  if (p.id && SCHEMATIC_COORDINATES[p.id]) {
    return SCHEMATIC_COORDINATES[p.id];
  }

  // Fallback defaults based on type & area
  const radius = p.type === 'dryer' ? 46 : p.type === 'pinion' ? 18 : 14;
  return { x: 500, y: 250, radius };
}

/**
 * Categorize equipment into 3 requested visual groups:
 * - Secadores (large circle)
 * - Piñones (circle with purple border)
 * - Rodillos (blue / green circles)
 */
export function getEquipmentCategory(p: MeasurementPoint): 'dryer' | 'pinion' | 'roller' {
  if (p.type === 'dryer') return 'dryer';
  if (p.type === 'pinion') return 'pinion';
  return 'roller';
}

/**
 * Check if equipment is 100% completed according to user specification:
 * Green if totally completed 100% (sensor + cable + connection, or status === 'verified'),
 * Red if not completed 100%.
 */
export function isEquipment100PercentComplete(p: MeasurementPoint): boolean {
  if (p.status === 'verified') return true;
  const stages = p.stages;
  if (!stages) return false;
  return Boolean(stages.sensorMounted && stages.cablePulled && stages.connectedToJB);
}

/**
 * Get human-readable area name matching the engineering drawings:
 * - Secadores Area 1 Lado 3
 * - Secadores Area 2 Lado 3
 * - Secadores Area 3 Lado 3
 */
export function getAreaTitle(area: 1 | 2 | 3): string {
  switch (area) {
    case 1:
      return 'Secadores Area 1 Lado 3';
    case 2:
      return 'Secadores Area 2 Lado 3';
    case 3:
      return 'Secadores Area 3 Lado 3';
    default:
      return `Secadores Area ${area} Lado 3`;
  }
}
