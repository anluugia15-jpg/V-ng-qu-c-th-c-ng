
import { Entity, EntityType, ZooZone, AquaZone, FarmZone, GardenZone, RestaurantZone } from './types';

export const INITIAL_COINS = 200;

export const FISH_SPECIES = [
  // CORAL REEF (Rạn San Hô)
  { name: 'Cá Vàng', emoji: '🐠', price: 15, description: 'Hiền lành, dễ nuôi, thích hợp cho người mới.', careLevel: 'Dễ', diet: 'herbivore', habitat: AquaZone.CORAL_REEF },
  { name: 'Cá Nhiệt Đới', emoji: '🐟', price: 25, description: 'Màu sắc sặc sỡ, bơi nhanh và thích sống theo đàn.', careLevel: 'Dễ', diet: 'herbivore', habitat: AquaZone.CORAL_REEF },
  { name: 'Cua', emoji: '🦀', price: 30, description: 'Bò ngang dưới đáy bể, dọn dẹp thức ăn thừa.', careLevel: 'Dễ', diet: 'carnivore', habitat: AquaZone.CORAL_REEF },
  { name: 'Cá Nóc', emoji: '🐡', price: 60, description: 'Sẽ phồng lên khi giận dữ. Cần chế độ ăn đặc biệt.', careLevel: 'Trung bình', diet: 'herbivore', habitat: AquaZone.CORAL_REEF },
  { name: 'Tôm Hùm', emoji: '🦞', price: 180, description: 'Ông hoàng vỏ giáp, rất sang chảnh.', careLevel: 'Khó', diet: 'carnivore', habitat: AquaZone.CORAL_REEF },

  // OPEN OCEAN (Đại Dương)
  { name: 'Rùa Biển', emoji: '🐢', price: 80, description: 'Sống rất thọ, bơi lội chậm rãi và hiền hòa.', careLevel: 'Trung bình', diet: 'herbivore', habitat: AquaZone.OPEN_OCEAN },
  { name: 'Sứa', emoji: '🪼', price: 45, description: 'Trôi lững lờ, đẹp lung linh nhưng đừng chạm vào!', careLevel: 'Trung bình', diet: 'herbivore', habitat: AquaZone.OPEN_OCEAN },
  { name: 'Bạch Tuộc', emoji: '🐙', price: 120, description: 'Thông minh, thích chơi trốn tìm. Sẽ ăn cá nhỏ khi đói!', careLevel: 'Khó', diet: 'carnivore', habitat: AquaZone.OPEN_OCEAN },
  { name: 'Mực', emoji: '🦑', price: 140, description: 'Di chuyển nhanh và thích phun mực.', careLevel: 'Khó', diet: 'carnivore', habitat: AquaZone.OPEN_OCEAN },
  { name: 'Cá Heo', emoji: '🐬', price: 350, description: 'Thông minh tuyệt đỉnh, thích nhảy múa và chơi đùa.', careLevel: 'Khó', diet: 'carnivore', habitat: AquaZone.OPEN_OCEAN },
  { name: 'Cá Voi', emoji: '🐳', price: 500, description: 'Gã khổng lồ hiền lành nhưng phàm ăn.', careLevel: 'Huyền thoại', diet: 'carnivore', habitat: AquaZone.OPEN_OCEAN },
  { name: 'Cá Mập Con', emoji: '🦈', price: 250, description: 'Sát thủ đại dương. Cần cẩn thận kẻo nó ăn hết cá trong bể!', careLevel: 'Rất khó', diet: 'carnivore', habitat: AquaZone.OPEN_OCEAN },
];

export const ANIMAL_SPECIES = [
  // JUNGLE (Rừng Nhiệt Đới)
  { name: 'Mèo', emoji: '🐱', price: 20, description: 'Thích ngủ và được vuốt ve. Rất sạch sẽ.', careLevel: 'Dễ', diet: 'herbivore', habitat: ZooZone.JUNGLE },
  { name: 'Chó', emoji: '🐶', price: 20, description: 'Trung thành, năng động và cần được chơi đùa.', careLevel: 'Dễ', diet: 'herbivore', habitat: ZooZone.JUNGLE },
  { name: 'Khỉ', emoji: '🐒', price: 50, description: 'Nghịch ngợm, hay leo trèo và ăn chuối.', careLevel: 'Trung bình', diet: 'herbivore', habitat: ZooZone.JUNGLE },
  { name: 'Gấu Trúc', emoji: '🐼', price: 120, description: 'Lười biếng nhưng cực kỳ đáng yêu. Chỉ ăn tre.', careLevel: 'Trung bình', diet: 'herbivore', habitat: ZooZone.JUNGLE },
  { name: 'Hươu Cao Cổ', emoji: '🦒', price: 160, description: 'Cổ dài miên man, nhìn được rất xa.', careLevel: 'Khó', diet: 'herbivore', habitat: ZooZone.JUNGLE },
  { name: 'Sư Tử', emoji: '🦁', price: 250, description: 'Chúa tể sơn lâm. Sẽ săn mồi khi đói bụng.', careLevel: 'Khó', diet: 'carnivore', habitat: ZooZone.JUNGLE },
  { name: 'Hổ', emoji: '🐯', price: 300, description: 'Mạnh mẽ và độc lập. Kẻ săn mồi thượng hạng.', careLevel: 'Khó', diet: 'carnivore', habitat: ZooZone.JUNGLE },
  { name: 'Voi', emoji: '🐘', price: 450, description: 'Thông minh, trí nhớ tốt và sống tình cảm.', careLevel: 'Rất khó', diet: 'herbivore', habitat: ZooZone.JUNGLE },

  // DESERT (Sa Mạc)
  { name: 'Lạc Đà', emoji: '🐫', price: 80, description: 'Chuyên gia đi trên cát nóng, có thể nhịn khát cực tốt.', careLevel: 'Trung bình', diet: 'herbivore', habitat: ZooZone.DESERT },
  { name: 'Bọ Cạp', emoji: '🦂', price: 40, description: 'Nhỏ nhưng có võ. Thích ẩn mình dưới cát.', careLevel: 'Dễ', diet: 'carnivore', habitat: ZooZone.DESERT },
  { name: 'Rắn Chuông', emoji: '🐍', price: 60, description: 'Nguy hiểm và khó lường. Cảnh báo bằng tiếng chuông đuôi.', careLevel: 'Khó', diet: 'carnivore', habitat: ZooZone.DESERT },
  { name: 'Cáo Sa Mạc', emoji: '🦊', price: 100, description: 'Tai to để tản nhiệt. Rất nhanh nhẹn vào ban đêm.', careLevel: 'Trung bình', diet: 'carnivore', habitat: ZooZone.DESERT },

  // ARCTIC (Bắc Cực)
  { name: 'Gấu Bắc Cực', emoji: '🐻‍❄️', price: 300, description: 'Ông vua vùng băng tuyết. Sức mạnh phi thường.', careLevel: 'Rất khó', diet: 'carnivore', habitat: ZooZone.ARCTIC },
  { name: 'Cáo Tuyết', emoji: '🐺', price: 150, description: 'Bộ lông trắng muốt giúp ngụy trang hoàn hảo.', careLevel: 'Khó', diet: 'carnivore', habitat: ZooZone.ARCTIC },
  { name: 'Hải Cẩu', emoji: '🦭', price: 120, description: 'Bơi giỏi hơn đi. Thích nằm phơi mình trên băng.', careLevel: 'Trung bình', diet: 'carnivore', habitat: ZooZone.ARCTIC },
  { name: 'Cú Tuyết', emoji: '🦉', price: 90, description: 'Săn mồi thầm lặng trong đêm trắng.', careLevel: 'Trung bình', diet: 'carnivore', habitat: ZooZone.ARCTIC },

  // ANTARCTIC (Nam Cực)
  { name: 'Chim Cánh Cụt', emoji: '🐧', price: 90, description: 'Không biết bay nhưng bơi như ngư lôi.', careLevel: 'Dễ', diet: 'carnivore', habitat: ZooZone.ANTARCTIC },
  { name: 'Hải Âu', emoji: '🐦', price: 50, description: 'Bay lượn trên bầu trời băng giá.', careLevel: 'Dễ', diet: 'carnivore', habitat: ZooZone.ANTARCTIC },
  { name: 'Cá Voi Sát Thủ', emoji: '🐋', price: 500, description: 'Kẻ săn mồi đỉnh cao của đại dương băng giá.', careLevel: 'Huyền thoại', diet: 'carnivore', habitat: ZooZone.ANTARCTIC },
];

export const FARM_SPECIES = [
  { 
    name: 'Gà', emoji: '🐔', price: 10, description: 'Thức dậy sớm gáy vang. Đẻ trứng mỗi ngày.', careLevel: 'Dễ', diet: 'omnivore', habitat: FarmZone.BARN,
    produce: { name: 'Trứng', emoji: '🥚', price: 5 }
  },
  { name: 'Gà Con', emoji: '🐤', price: 5, description: 'Nhỏ xíu, kêu chíp chíp. Cần sưởi ấm.', careLevel: 'Dễ', diet: 'omnivore', habitat: FarmZone.BARN },
  { 
    name: 'Bò Sữa', emoji: '🐮', price: 60, description: 'Cung cấp sữa thơm ngon. Thích gặm cỏ.', careLevel: 'Trung bình', diet: 'herbivore', habitat: FarmZone.FIELD,
    produce: { name: 'Sữa', emoji: '🥛', price: 15 }
  },
  { 
    name: 'Lợn', emoji: '🐷', price: 30, description: 'Thông minh, sạch sẽ (nếu được tắm). Ăn rất khỏe.', careLevel: 'Dễ', diet: 'omnivore', habitat: FarmZone.BARN,
    produce: { name: 'Nấm Cục', emoji: '🍄', price: 20 }
  },
  { 
    name: 'Cừu', emoji: '🐑', price: 50, description: 'Bộ lông ấm áp. Rất hiền lành và đi theo đàn.', careLevel: 'Trung bình', diet: 'herbivore', habitat: FarmZone.FIELD,
    produce: { name: 'Len', emoji: '🧶', price: 12 }
  },
  { name: 'Ngựa', emoji: '🐴', price: 100, description: 'Khỏe mạnh, chạy nhanh. Người bạn đồng hành tuyệt vời.', careLevel: 'Khó', diet: 'herbivore', habitat: FarmZone.FIELD },
  { 
    name: 'Vịt', emoji: '🦆', price: 15, description: 'Thích bơi lội dưới ao. Kêu cạp cạp vui tai.', careLevel: 'Dễ', diet: 'omnivore', habitat: FarmZone.POND,
    produce: { name: 'Trứng Vịt', emoji: '🥚', price: 6 }
  },
  { 
    name: 'Thiên Nga', emoji: '🦢', price: 200, description: 'Biểu tượng của sự thanh khiết. Bơi lội đầy kiêu hãnh.', careLevel: 'Khó', diet: 'herbivore', habitat: FarmZone.POND,
    produce: { name: 'Lông Vũ', emoji: '🪶', price: 25 }
  },
  { name: 'Chó Chăn Cừu', emoji: '🐕', price: 40, description: 'Bảo vệ nông trại khỏi kẻ lạ. Rất nghe lời.', careLevel: 'Trung bình', diet: 'carnivore', habitat: FarmZone.BARN },
];

export const GARDEN_SPECIES = [
  // VEGETABLES (Vườn Rau) - Single Harvest (isPerennial: false)
  { 
    name: 'Cà Rốt', price: 5, description: 'Dễ trồng, thu hoạch nhanh. Thức ăn yêu thích của thỏ.', careLevel: 'Dễ', habitat: GardenZone.VEGETABLES,
    stages: ['🌱', '🌿', '🥕'], isPerennial: false, producePrice: 10
  },
  { 
    name: 'Cải Bắp', price: 8, description: 'Cần nhiều nước, phát triển tốt ở nơi mát mẻ.', careLevel: 'Dễ', habitat: GardenZone.VEGETABLES,
    stages: ['🌱', '🪴', '🥬'], isPerennial: false, producePrice: 18
  },
  { 
    name: 'Dưa Hấu', price: 15, description: 'Quả to, cần nhiều đất. Mùa hè giải nhiệt rất tốt.', careLevel: 'Trung bình', habitat: GardenZone.VEGETABLES,
    stages: ['🌱', '🍃', '🍉'], isPerennial: false, producePrice: 35
  },
  { 
    name: 'Ngô', price: 10, description: 'Cao lớn, cho bắp vàng óng ngọt lịm.', careLevel: 'Trung bình', habitat: GardenZone.VEGETABLES,
    stages: ['🌱', '🌽', '🌽'], isPerennial: false, producePrice: 22 
  },

  // ORCHARD (Vườn Cây Ăn Quả) - Perennial (isPerennial: true)
  { 
    name: 'Cây Táo', price: 50, description: 'Cây lâu năm. Cần thời gian để lớn nhưng cho quả đều đặn.', careLevel: 'Khó', habitat: GardenZone.ORCHARD,
    stages: ['🌱', '🌳', '🍎'], isPerennial: true, producePrice: 20
  },
  { 
    name: 'Cây Cam', price: 55, description: 'Thơm ngát hương hoa, quả mọng nước giàu vitamin.', careLevel: 'Khó', habitat: GardenZone.ORCHARD,
    stages: ['🌱', '🌳', '🍊'], isPerennial: true, producePrice: 22
  },
  { 
    name: 'Cây Đào', price: 60, description: 'Hoa đẹp, quả ngọt. Biểu tượng của sự trường thọ.', careLevel: 'Rất Khó', habitat: GardenZone.ORCHARD,
    stages: ['🌱', '🌳', '🍑'], isPerennial: true, producePrice: 25
  },

  // FLOWERS (Vườn Hoa)
  { 
    name: 'Hoa Hồng', price: 20, description: 'Nữ hoàng của các loài hoa. Cần chăm sóc tỉ mỉ.', careLevel: 'Trung bình', habitat: GardenZone.FLOWERS,
    stages: ['🌱', '🥀', '🌹'], isPerennial: true, producePrice: 15
  },
  { 
    name: 'Hướng Dương', price: 12, description: 'Luôn hướng về phía mặt trời. Mang lại năng lượng tích cực.', careLevel: 'Dễ', habitat: GardenZone.FLOWERS,
    stages: ['🌱', '🎋', '🌻'], isPerennial: false, producePrice: 20
  },
  { 
    name: 'Tulip', price: 25, description: 'Loài hoa kiêu sa với nhiều màu sắc rực rỡ.', careLevel: 'Khó', habitat: GardenZone.FLOWERS,
    stages: ['🌱', '🌷', '💐'], isPerennial: false, producePrice: 40
  },
];

export const RESTAURANT_MENU = [
  // FOOD
  { id: 'burger', name: 'Burger', emoji: '🍔', price: 30, timeToEat: 5000, type: 'food' },
  { id: 'pizza', name: 'Pizza', emoji: '🍕', price: 40, timeToEat: 6000, type: 'food' },
  { id: 'sushi', name: 'Sushi', emoji: '🍣', price: 50, timeToEat: 4000, type: 'food' },
  { id: 'steak', name: 'Bít Tết', emoji: '🥩', price: 80, timeToEat: 8000, type: 'food' },
  { id: 'carrot_cake', name: 'Bánh Cà Rốt', emoji: '🥕', price: 20, timeToEat: 3000, type: 'food' }, // From Garden
  { id: 'egg_tart', name: 'Bánh Trứng', emoji: '🥚', price: 15, timeToEat: 3000, type: 'food' }, // From Farm

  // DRINKS
  { id: 'coffee', name: 'Cà Phê', emoji: '☕', price: 15, timeToEat: 3000, type: 'drink' },
  { id: 'milk', name: 'Sữa Tươi', emoji: '🥛', price: 12, timeToEat: 3000, type: 'drink' }, // From Farm
  { id: 'tea', name: 'Trà Đào', emoji: '🍹', price: 18, timeToEat: 4000, type: 'drink' },
  { id: 'wine', name: 'Vang Đỏ', emoji: '🍷', price: 100, timeToEat: 6000, type: 'drink' },
];

export const RESTAURANT_CUSTOMERS = [
  { name: 'Thỏ Thực Khách', emoji: '🐰', speed: 1 },
  { name: 'Gấu Sành Ăn', emoji: '🐻', speed: 0.8 },
  { name: 'Mèo Quý Tộc', emoji: '🐱', speed: 1.2 },
  { name: 'Heo Ham Ăn', emoji: '🐷', speed: 0.9 },
  { name: 'Vịt Donal', emoji: '🦆', speed: 1.1 },
];

export const GARDEN_ITEMS = [
  { id: 'water', name: 'Nước', emoji: '💧', price: 0, hunger: 20, happiness: 0, description: 'Miễn phí, cây nào cũng cần' },
  { id: 'fertilizer', name: 'Phân Bón', emoji: '💩', price: 10, hunger: 50, happiness: 20, description: 'Giúp cây lớn nhanh như thổi' },
  { id: 'premium_soil', name: 'Đất Sạch', emoji: '🟤', price: 25, hunger: 100, happiness: 50, description: 'Cải tạo đất, tăng chất lượng quả' },
  { id: 'sun_lamp', name: 'Đèn Sưởi', emoji: '💡', price: 40, hunger: 0, happiness: 100, description: 'Cung cấp ánh sáng nhân tạo' },
];

export const FISH_FOODS = [
  { id: 'crumbs', name: 'Vụn Bánh Mì', emoji: '🍞', price: 3, hunger: 10, happiness: 5, description: 'Rẻ nhưng nhanh đói' },
  { id: 'pellets', name: 'Viên Dinh Dưỡng', emoji: '💊', price: 8, hunger: 30, happiness: 10, description: 'Kinh tế nhất' },
  { id: 'worms', name: 'Sâu Đỏ', emoji: '🪱', price: 15, hunger: 60, happiness: 25, description: 'Tốt cho phát triển' },
  { id: 'shrimp', name: 'Tôm Cao Cấp', emoji: '🦐', price: 35, hunger: 100, happiness: 50, description: 'Thúc đẩy sinh sản cực nhanh' },
];

export const ANIMAL_FOODS = [
  { id: 'grass', name: 'Cỏ Tươi', emoji: '🌿', price: 5, hunger: 15, happiness: 5, description: 'Cơ bản cho loài ăn cỏ' },
  { id: 'fruit', name: 'Trái Cây', emoji: '🍎', price: 12, hunger: 35, happiness: 20, description: 'Ngọt ngào, tăng vui vẻ' },
  { id: 'meat', name: 'Thịt Tươi', emoji: '🍖', price: 20, hunger: 60, happiness: 15, description: 'Bắt buộc cho loài ăn thịt' },
  { id: 'premium', name: 'Thức Ăn Hạng A', emoji: '🍱', price: 40, hunger: 100, happiness: 60, description: 'Giúp thú lớn nhanh như thổi' },
];

export const FARM_FOODS = [
  { id: 'seeds', name: 'Hạt Giống', emoji: '🌾', price: 2, hunger: 10, happiness: 5, description: 'Thức ăn chính cho gia cầm' },
  { id: 'hay', name: 'Cỏ Khô', emoji: '🚜', price: 5, hunger: 20, happiness: 10, description: 'Dự trữ cho gia súc' },
  { id: 'corn', name: 'Bắp Ngô', emoji: '🌽', price: 8, hunger: 40, happiness: 15, description: 'Vỗ béo rất tốt' },
  { id: 'carrot', name: 'Cà Rốt', emoji: '🥕', price: 10, hunger: 50, happiness: 30, description: 'Món khoái khẩu của thỏ và ngựa' },
];

export const INITIAL_ENTITIES: Entity[] = [
  {
    id: '1',
    name: 'Goldie',
    emoji: '🐠',
    type: EntityType.FISH,
    hunger: 80,
    happiness: 90,
    x: 50,
    y: 50,
    species: 'Cá Vàng',
    diet: 'herbivore',
    habitat: AquaZone.CORAL_REEF,
    facingRight: false,
    rotation: 0,
    reproductionProgress: 20
  },
  {
    id: '2',
    name: 'Rex',
    emoji: '🐶',
    type: EntityType.ANIMAL,
    hunger: 70,
    happiness: 80,
    x: 20,
    y: 60,
    species: 'Chó',
    diet: 'herbivore',
    habitat: ZooZone.JUNGLE,
    facingRight: true,
    rotation: 0,
    reproductionProgress: 0
  }
];
