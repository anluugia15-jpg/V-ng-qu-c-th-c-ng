
export enum GameMode {
  DASHBOARD = 'DASHBOARD',
  AQUARIUM = 'AQUARIUM',
  ZOO = 'ZOO',
  FARM = 'FARM',
  GARDEN = 'GARDEN',
  RESTAURANT = 'RESTAURANT',
}

export enum EntityType {
  FISH = 'FISH',
  ANIMAL = 'ANIMAL', // Dùng chung cho cả Zoo và Farm
  PLANT = 'PLANT',
  CUSTOMER = 'CUSTOMER',
}

export enum WeatherType {
  CLEAR = 'CLEAR',
  RAIN = 'RAIN',
  STORM = 'STORM',
  SNOW = 'SNOW',
}

export enum ZooZone {
  JUNGLE = 'JUNGLE',   // Rừng nhiệt đới
  DESERT = 'DESERT',   // Sa mạc
  ARCTIC = 'ARCTIC',   // Bắc cực
  ANTARCTIC = 'ANTARCTIC', // Nam cực
}

export enum AquaZone {
  CORAL_REEF = 'CORAL_REEF', // Rạn San Hô
  OPEN_OCEAN = 'OPEN_OCEAN', // Đại Dương
}

export enum FarmZone {
  BARN = 'BARN', // Chuồng trại
  FIELD = 'FIELD', // Cánh đồng
  POND = 'POND', // Ao hồ
}

export enum GardenZone {
  VEGETABLES = 'VEGETABLES', // Vườn rau
  ORCHARD = 'ORCHARD', // Vườn cây ăn quả
  FLOWERS = 'FLOWERS', // Vườn hoa
}

export enum RestaurantZone {
  DINING = 'DINING', // Khu ăn uống
  BAR = 'BAR',       // Quầy bar/cafe
  KITCHEN = 'KITCHEN', // Bếp
}

export type MovementPattern = 'random' | 'circle' | 'zigzag' | 'custom';

export interface Entity {
  id: string;
  name: string;
  emoji: string;
  type: EntityType;
  hunger: number; // 0-100, for plants this is "Hydration/Nutrition"
  happiness: number; // 0-100, for plants this is "Health"
  x: number; // Position X (%)
  y: number; // Position Y (%)
  species: string;
  diet?: 'carnivore' | 'herbivore' | 'omnivore'; // Diet type (added omnivore for pigs/chickens)
  habitat?: ZooZone | AquaZone | FarmZone | GardenZone | RestaurantZone; // Zone preference
  facingRight?: boolean; // Direction for fish (true if moving right)
  rotation?: number; // Tilt angle in degrees
  reproductionProgress?: number; // 0-100, at 100 spawns a baby
  transitionDuration?: number; // Duration of the current move in ms
  isColliding?: boolean; // True if hitting the wall boundaries
  
  // Production Logic (Farm)
  productionProgress?: number; // 0-100
  isProductReady?: boolean; // True if ready to harvest
  
  // Garden Logic
  growthStage?: number; // 0: Seed, 1: Sprout, 2: Mature/Blooming, 3: Harvestable
  isPerennial?: boolean; // True if plant stays after harvest (trees), False if removed (carrots)

  // Restaurant Logic
  diningState?: 'walking_in' | 'waiting' | 'eating' | 'paying' | 'walking_out';
  orderItem?: { name: string, emoji: string, price: number, timeToEat: number };
  tableId?: number; // ID of the table they are sitting at
}

export interface GameState {
  coins: number;
  entities: Entity[];
}

export interface AIEvent {
  message: string;
  bonus?: number;
}
