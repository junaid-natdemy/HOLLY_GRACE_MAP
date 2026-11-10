import { Stage } from '../types/campus';

/**
 * EXACT CAMPUS STAGE TO POSITION MAPPING
 * Configured with stages mapped to their campus buildings.
 */
export const CAMPUS_STAGES: Stage[] = [
  {
    "stageNumber": 1,
    "name": "Ephatha Auditorium",
    "positionId": 1,
    "floor": "3rd Floor"
  },
  {
    "stageNumber": 3,
    "name": "XI-E",
    "positionId": 1,
    "floor": "2nd Floor"
  },
  {
    "stageNumber": 4,
    "name": "XI-C / XI-F",
    "positionId": 1,
    "floor": "2nd Floor"
  },
  {
    "stageNumber": 5,
    "name": "XII-C / XII-F",
    "positionId": 1,
    "floor": "2nd Floor"
  },
  {
    "stageNumber": 12,
    "name": "12 A",
    "positionId": 2,
    "floor": "1st Floor"
  },
  {
    "stageNumber": 13,
    "name": "12 B",
    "positionId": 2,
    "floor": "2nd Floor"
  },
  {
    "stageNumber": 14,
    "name": "11 A",
    "positionId": 2,
    "floor": "2nd Floor"
  },
  {
    "stageNumber": 10,
    "name": "Swimming Area",
    "positionId": 3,
    "floor": "Outdoor"
  },
  {
    "stageNumber": 29,
    "name": "Boys Hostel Ground",
    "positionId": 4,
    "floor": "Ground / Outdoor"
  },
  {
    "stageNumber": 15,
    "name": "Robotics Lab",
    "positionId": 5,
    "floor": "Ground Floor"
  },
  {
    "stageNumber": 16,
    "name": "Lecture Hall 1",
    "positionId": 5,
    "floor": "Ground Floor"
  },
  {
    "stageNumber": 17,
    "name": "Lecture Hall 2",
    "positionId": 5,
    "floor": "Ground Floor"
  },
  {
    "stageNumber": 18,
    "name": "MBA Seminar Hall",
    "positionId": 5,
    "floor": "1st Floor"
  },
  {
    "stageNumber": 19,
    "name": "S1/S2-A, LH103",
    "positionId": 5,
    "floor": "1st Floor"
  },
  {
    "stageNumber": 20,
    "name": "LH122 (opp. AI Lab)",
    "positionId": 5,
    "floor": "1st Floor"
  },
  {
    "stageNumber": 21,
    "name": "LH211 (Poly)",
    "positionId": 5,
    "floor": "2nd Floor"
  },
  {
    "stageNumber": 22,
    "name": "Seminar Hall SH218",
    "positionId": 5,
    "floor": "2nd Floor"
  },
  {
    "stageNumber": 23,
    "name": "LH216",
    "positionId": 5,
    "floor": "2nd Floor"
  },
  {
    "stageNumber": 24,
    "name": "LH203",
    "positionId": 5,
    "floor": "2nd Floor"
  },
  {
    "stageNumber": 25,
    "name": "LH116",
    "positionId": 5,
    "floor": "1st Floor"
  },
  {
    "stageNumber": 26,
    "name": "Room 118",
    "positionId": 5,
    "floor": "1st Floor"
  },
  {
    "stageNumber": 27,
    "name": "CL107 (opp. Exam Cell)",
    "positionId": 5,
    "floor": "1st Floor"
  },
  {
    "stageNumber": 28,
    "name": "Seminar Hall 123",
    "positionId": 5,
    "floor": "1st Floor"
  },
  {
    "stageNumber": 0,
    "name": "Main Stage",
    "positionId": 21,
    "floor": "Main Floor"
  },
  {
    "stageNumber": 7,
    "name": "Lunch Area Stage",
    "positionId": 22,
    "floor": "Ground Floor"
  },
  {
    "stageNumber": -22,
    "name": "Green Room",
    "positionId": 22,
    "floor": "Ground Floor",
    "category": "green_room",
    "tags": [
      "green room",
      "makeup",
      "dressing",
      "costume",
      "artists",
      "zion"
    ]
  },
  {
    "stageNumber": -23,
    "name": "Green Room",
    "positionId": 23,
    "floor": "Ground Floor",
    "category": "green_room",
    "tags": [
      "green room",
      "makeup",
      "dressing",
      "costume",
      "artists",
      "divine"
    ]
  },
  {
    "stageNumber": 2,
    "name": "VI-G",
    "positionId": 24,
    "floor": "2nd Floor"
  },
  {
    "stageNumber": 6,
    "name": "VI-F",
    "positionId": 24,
    "floor": "2nd Floor"
  },
  {
    "stageNumber": 8,
    "name": "ECCE inner court (KG Court)",
    "positionId": 25,
    "floor": "Ground Floor"
  },
  {
    "stageNumber": 30,
    "name": "Near Hostel \u00b7 Stage 1",
    "positionId": 26,
    "floor": "Outdoor"
  },
  {
    "stageNumber": 31,
    "name": "Near Hostel \u00b7 Stage 2",
    "positionId": 26,
    "floor": "Outdoor"
  },
  {
    "stageNumber": 32,
    "name": "Near Hostel \u00b7 Stage 3",
    "positionId": 26,
    "floor": "Outdoor"
  },
  {
    "stageNumber": 9,
    "name": "Ground Stage 1",
    "positionId": 28,
    "floor": "Outdoor"
  },
  {
    "stageNumber": 11,
    "name": "Ground Stage 2",
    "positionId": 28,
    "floor": "Outdoor"
  }
];

export function getDefaultCampusStages(): Stage[] {
  return JSON.parse(JSON.stringify(CAMPUS_STAGES));
}

/**
 * Get stage by its number
 */
export function getStageByNumber(stageNumber: number, customStages?: Stage[]): Stage | undefined {
  const list = customStages || CAMPUS_STAGES;
  return list.find((s) => s.stageNumber === stageNumber);
}

/**
 * Get all stages mapped to a specific campus position
 */
export function getStagesByPositionId(positionId: number, customStages?: Stage[]): Stage[] {
  const list = customStages || CAMPUS_STAGES;
  return list.filter((s) => s.positionId === positionId);
}

/**
 * Search stages by number or query text (matching stage name, stage number, category, or floor)
 */
export function searchStages(query: string, customStages?: Stage[]): Stage[] {
  const list = customStages || CAMPUS_STAGES;
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return list;

  const num = parseInt(trimmed, 10);
  if (!isNaN(num) && num > 0) {
    return list.filter((s) => s.stageNumber === num);
  }

  const tokens = trimmed.split(/\s+/);

  return list.filter((s) => {
    const combined = `${s.name} ${s.floor || ''} ${s.category || ''} ${(s.tags || []).join(' ')}`.toLowerCase();
    const stageNumMatch = s.stageNumber > 0 && `stage ${s.stageNumber}`.toLowerCase().includes(trimmed);
    const tokensMatch = tokens.every((token) => combined.includes(token));
    return stageNumMatch || tokensMatch;
  });
}
