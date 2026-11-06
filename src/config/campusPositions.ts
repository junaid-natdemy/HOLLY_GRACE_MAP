import { CampusPosition } from '../types/campus';

export const CAMPUS_POSITIONS: CampusPosition[] = [
  {
    id: 1,
    name: "Silver Jubilee Block",
    description: "Hostel and Academic wing near South Gate",
    pixelCoord: {
      x: 434,
      y: 550
    },
    normalizedCoord: {
      x: 0.3390625,
      y: 0.710594315245478
    },
    roadNetworkNodeId: "pos1",
    category: "academic"
  },
  {
    id: 2,
    name: "CBSE School Block",
    description: "Central Administrative & Classroom Complex",
    pixelCoord: {
      x: 794,
      y: 382
    },
    normalizedCoord: {
      x: 0.6203125,
      y: 0.4935400516795866
    },
    roadNetworkNodeId: "pos2",
    category: "academic"
  },
  {
    id: 3,
    name: "ECCE Block",
    description: "Auditorium & Laboratories via Covered Walkway",
    pixelCoord: {
      x: 816,
      y: 502
    },
    normalizedCoord: {
      x: 0.6375,
      y: 0.648578811369509
    },
    roadNetworkNodeId: "pos3",
    category: "academic"
  },
  {
    id: 4,
    name: "Ground Stage",
    description: "Open Arena and Festival Stage Complex",
    pixelCoord: {
      x: 821,
      y: 262
    },
    normalizedCoord: {
      x: 0.64140625,
      y: 0.3385012919896641
    },
    roadNetworkNodeId: "pos4",
    category: "outdoor"
  },
  {
    id: 5,
    name: "Pool",
    description: "Central Covered Structure & Activity Center",
    pixelCoord: {
      x: 601,
      y: 251
    },
    normalizedCoord: {
      x: 0.46953125,
      y: 0.3242894056847545
    },
    roadNetworkNodeId: "pos5",
    category: "outdoor"
  },
  {
    id: 6,
    name: "College Block",
    description: "Upper Campus Main Academic Ribbon",
    pixelCoord: {
      x: 656,
      y: 189
    },
    normalizedCoord: {
      x: 0.5125,
      y: 0.2441860465116279
    },
    roadNetworkNodeId: "pos6",
    category: "academic"
  },
  {
    id: 7,
    name: "Near Boys Hostel",
    description: "Elevated Western Green Pavilion & Gazebo",
    pixelCoord: {
      x: 337,
      y: 155
    },
    normalizedCoord: {
      x: 0.26328125,
      y: 0.20025839793281655
    },
    roadNetworkNodeId: "pos7",
    category: "administrative"
  },
  {
    id: 8,
    name: "Boys Hostel",
    description: "Upper North Multi-story Block & Residential Hall",
    pixelCoord: {
      x: 400,
      y: 81
    },
    normalizedCoord: {
      x: 0.3125,
      y: 0.10465116279069768
    },
    roadNetworkNodeId: "pos8",
    category: "administrative"
  },
  {
    id: 9,
    name: "Zion Auditorium",
    description: "Main Event Auditorium & Cultural Stage Complex",
    pixelCoord: {
      x: 988,
      y: 333
    },
    normalizedCoord: {
      x: 0.771875,
      y: 0.43023255813953487
    },
    roadNetworkNodeId: "pos9",
    category: "auditorium"
  },
  {
    id: 10,
    name: "VIP Parking",
    description: "Open Festival Ground & Parking Arena",
    pixelCoord: {
      x: 936,
      y: 217
    },
    normalizedCoord: {
      x: 0.73125,
      y: 0.28036175710594313
    },
    roadNetworkNodeId: "pos10",
    category: "outdoor"
  },
  {
    id: 11,
    name: "Zion Block",
    description: "Engineering & Technical Wing",
    pixelCoord: {
      x: 1112.5,
      y: 386.3
    },
    normalizedCoord: {
      x: 0.869140625,
      y: 0.4990956072351421
    },
    roadNetworkNodeId: "node_mec1s",
    category: "academic"
  },
  {
    id: 12,
    name: "Stalls",
    description: "Campus Refreshment & Festival Stalls",
    pixelCoord: {
      x: 912,
      y: 275
    },
    normalizedCoord: {
      x: 0.7125,
      y: 0.355297157622739
    },
    roadNetworkNodeId: "node_msu38",
    category: "outdoor"
  }
];

/**
 * Formats any raw or legacy building name into a standard, classic, minimal,
 * premium Google Maps-style building name.
 */
export function formatBuildingDisplayName(rawName: string): string {
  if (!rawName) return '';
  const trimmed = rawName.trim();

  // Known legacy mappings to clean, standard, minimal names
  const legacyMap: Record<string, string> = {
    'SILVER JUBILEE BLOCK (NEW BLOCK)': 'Silver Jubilee Block',
    'CBSE-SCHOO-BLOCK-EPHATHA & SHALOM': 'CBSE School Block',
    'ECCE BLOCK (KG)': 'ECCE Block',
    'GROUND STAGE': 'Ground Stage',
    'POOL': 'Pool',
    'COLLAGE-BLOCK_MBA_ENGINEERING_POLYTECHNIC': 'College Block',
    'NEAR BOYS HOSTEL': 'Near Boys Hostel',
    'BOYS HOSTEL': 'Boys Hostel',
    'ZION AUDITORIUM': 'Zion Auditorium',
    'VIP PARKING': 'VIP Parking',
    'ZION BLOCK': 'Zion Block',
    'STALLS': 'Stalls',
    'South-West Complex': 'Silver Jubilee Block',
    'Main Academic Block – Central': 'CBSE School Block',
    'Auditorium Complex': 'ECCE Block',
    'Central Covered Area': 'Pool',
    'North-West Ribbon': 'College Block',
    'Gazebo Pavilion': 'Near Boys Hostel',
    'North Residential Block': 'Boys Hostel',
    'East Event Ground': 'Zion Auditorium',
    'Festival Arena': 'VIP Parking',
  };

  if (legacyMap[trimmed]) {
    return legacyMap[trimmed];
  }

  // Convert raw underscores and hyphens to spaces
  let clean = trimmed.replace(/_/g, ' ').replace(/-/g, ' ');

  // If ALL CAPS or SCREAMING_SNAKE, convert to clean Title Case
  if (clean === clean.toUpperCase() && clean.length > 2) {
    clean = clean
      .toLowerCase()
      .split(' ')
      .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : ''))
      .join(' ');
  }

  return clean;
}

export function getPositionById(id: number, customPositions?: CampusPosition[]): CampusPosition | undefined {
  const list = customPositions || CAMPUS_POSITIONS;
  return list.find((p) => p.id === id);
}

export function getDefaultCampusPositions(): CampusPosition[] {
  return JSON.parse(JSON.stringify(CAMPUS_POSITIONS));
}
