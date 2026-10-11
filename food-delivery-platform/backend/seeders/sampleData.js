/**
 * Demo marketplace content used by the seeder. Everything here is ordinary data that can be
 * edited or deleted from the Admin Panel / Vendor Dashboard afterwards.
 */
module.exports = {
  categories: [
    { name: 'Pizza', colors: ['#F97316', '#DC2626'] },
    { name: 'Burgers', colors: ['#F59E0B', '#B45309'] },
    { name: 'Biryani', colors: ['#EAB308', '#A16207'] },
    { name: 'Desserts', colors: ['#EC4899', '#9D174D'] },
    { name: 'Healthy', colors: ['#22C55E', '#15803D'] },
    { name: 'Chinese', colors: ['#EF4444', '#7F1D1D'] },
    { name: 'South Indian', colors: ['#84CC16', '#3F6212'] },
    { name: 'Beverages', colors: ['#06B6D4', '#155E75'] },
  ],
  cuisines: [
    { name: 'Italian', colors: ['#16A34A', '#DC2626'] },
    { name: 'North Indian', colors: ['#F59E0B', '#7C2D12'] },
    { name: 'American', colors: ['#2563EB', '#DC2626'] },
    { name: 'Chinese', colors: ['#DC2626', '#FACC15'] },
    { name: 'Mughlai', colors: ['#92400E', '#FBBF24'] },
    { name: 'Desserts', colors: ['#DB2777', '#F9A8D4'] },
    { name: 'Healthy', colors: ['#059669', '#A7F3D0'] },
    { name: 'Beverages', colors: ['#0891B2', '#A5F3FC'] },
  ],
  banners: [
    { title: '50% OFF on your first order', subtitle: 'Use code WELCOME50', colors: ['#E23744', '#F8B400'], linkType: 'coupon', linkValue: 'WELCOME50' },
    { title: 'Free delivery weekend', subtitle: 'On orders above the free-delivery threshold', colors: ['#7C3AED', '#2563EB'], linkType: 'none' },
    { title: 'Biryani festival', subtitle: 'Best biryanis in town', colors: ['#B45309', '#F59E0B'], linkType: 'category', linkValue: 'Biryani' },
  ],
  restaurants: [
    {
      owner: { name: 'Marco Rossi', email: 'vendor1@example.com', phone: '+910000000101' },
      name: 'Bella Napoli Pizzeria',
      description: 'Wood-fired Neapolitan pizzas and fresh pastas.',
      cuisines: ['Italian', 'Desserts'],
      categories: ['Pizza', 'Desserts'],
      priceForTwo: 600,
      avgPrepTimeMinutes: 25,
      offerText: '20% OFF',
      isFeatured: true,
      offset: [0.01, 0.008],
      colors: ['#DC2626', '#16A34A'],
      menu: {
        Pizzas: [
          { name: 'Margherita', price: 299, isVeg: true, isBestseller: true, description: 'San Marzano tomato, fior di latte, basil.', addOns: [{ name: 'Size', required: true, maxSelect: 1, options: [{ name: 'Regular', price: 0 }, { name: 'Medium', price: 120 }, { name: 'Large', price: 220 }] }, { name: 'Extra toppings', required: false, maxSelect: 3, options: [{ name: 'Olives', price: 40 }, { name: 'Jalapeños', price: 40 }, { name: 'Extra cheese', price: 60 }] }] },
          { name: 'Pepperoni', price: 399, isVeg: false, isBestseller: true, description: 'Spicy pepperoni, mozzarella, oregano.', addOns: [{ name: 'Size', required: true, maxSelect: 1, options: [{ name: 'Regular', price: 0 }, { name: 'Large', price: 240, isVeg: false }] }] },
          { name: 'Funghi', price: 349, discountPrice: 299, isVeg: true, description: 'Wild mushrooms, truffle oil, thyme.' },
        ],
        Pastas: [
          { name: 'Penne Arrabbiata', price: 279, isVeg: true, description: 'Spicy tomato & garlic sauce.' },
          { name: 'Spaghetti Carbonara', price: 349, isVeg: false, description: 'Egg, pecorino, guanciale.' },
        ],
        Desserts: [{ name: 'Tiramisu', price: 199, isVeg: true, isBestseller: true, description: 'Classic mascarpone & espresso.' }],
      },
    },
    {
      owner: { name: 'Ayesha Khan', email: 'vendor2@example.com', phone: '+910000000102' },
      name: 'Royal Biryani House',
      description: 'Slow-cooked dum biryanis and kebabs.',
      cuisines: ['Mughlai', 'North Indian'],
      categories: ['Biryani'],
      priceForTwo: 500,
      avgPrepTimeMinutes: 30,
      offerText: 'FREE DELIVERY',
      isFeatured: true,
      offset: [-0.012, 0.01],
      colors: ['#92400E', '#FBBF24'],
      menu: {
        Biryani: [
          { name: 'Chicken Dum Biryani', price: 329, isVeg: false, isBestseller: true, description: 'Basmati, saffron, tender chicken.', addOns: [{ name: 'Portion', required: true, maxSelect: 1, options: [{ name: 'Half', price: 0, isVeg: false }, { name: 'Full', price: 150, isVeg: false }] }, { name: 'Sides', required: false, maxSelect: 2, options: [{ name: 'Raita', price: 30 }, { name: 'Salan', price: 40 }] }] },
          { name: 'Veg Dum Biryani', price: 249, isVeg: true, description: 'Seasonal vegetables, fried onions.' },
          { name: 'Mutton Biryani', price: 429, isVeg: false, description: 'Hyderabadi style mutton biryani.' },
        ],
        Kebabs: [
          { name: 'Seekh Kebab', price: 279, isVeg: false, description: 'Minced lamb skewers.' },
          { name: 'Paneer Tikka', price: 249, isVeg: true, isBestseller: true, description: 'Charred cottage cheese, mint chutney.' },
        ],
      },
    },
    {
      owner: { name: 'Jake Miller', email: 'vendor3@example.com', phone: '+910000000103' },
      name: 'Stack Burger Co.',
      description: 'Smash burgers, fries and thick shakes.',
      cuisines: ['American', 'Beverages'],
      categories: ['Burgers', 'Beverages'],
      priceForTwo: 450,
      avgPrepTimeMinutes: 20,
      offerText: '',
      isFeatured: false,
      offset: [0.006, -0.011],
      colors: ['#2563EB', '#F59E0B'],
      menu: {
        Burgers: [
          { name: 'Classic Smash Burger', price: 249, isVeg: false, isBestseller: true, description: 'Double patty, cheese, house sauce.', addOns: [{ name: 'Make it a meal', required: false, maxSelect: 1, options: [{ name: 'Fries + Coke', price: 99 }] }] },
          { name: 'Crispy Veg Burger', price: 179, isVeg: true, description: 'Crunchy veg patty, lettuce, mayo.' },
        ],
        Sides: [{ name: 'Peri Peri Fries', price: 119, isVeg: true }],
        Shakes: [{ name: 'Chocolate Shake', price: 159, isVeg: true, isBestseller: true }, { name: 'Strawberry Shake', price: 159, isVeg: true }],
      },
    },
    {
      owner: { name: 'Lakshmi Iyer', email: 'vendor4@example.com', phone: '+910000000104' },
      name: 'Green Bowl Kitchen',
      description: 'Salads, bowls and cold-pressed juices.',
      cuisines: ['Healthy', 'Beverages'],
      categories: ['Healthy', 'Beverages', 'South Indian'],
      priceForTwo: 550,
      avgPrepTimeMinutes: 15,
      offerText: '10% OFF',
      isPureVeg: true,
      isFeatured: false,
      offset: [-0.007, -0.006],
      colors: ['#059669', '#A3E635'],
      menu: {
        Bowls: [
          { name: 'Quinoa Buddha Bowl', price: 329, isVeg: true, isBestseller: true, description: 'Quinoa, chickpeas, greens, tahini.' },
          { name: 'Masala Dosa Bowl', price: 199, isVeg: true, description: 'Dosa crisps, potato masala, chutneys.' },
        ],
        Juices: [{ name: 'Green Detox', price: 149, isVeg: true }, { name: 'ABC Juice', price: 149, isVeg: true }],
      },
    },
  ],
  coupons: [
    { code: 'WELCOME50', title: 'Welcome offer', description: '50% off your first order', discountType: 'percent', value: 50, maxDiscount: 150, minOrderValue: 199, firstOrderOnly: true, perUserLimit: 1 },
    { code: 'FLAT100', title: 'Flat 100 off', description: 'On orders above 599', discountType: 'flat', value: 100, minOrderValue: 599, perUserLimit: 3 },
    { code: 'FREEDEL', title: 'Free delivery', description: 'Delivery on us', discountType: 'free_delivery', value: 0, minOrderValue: 249, perUserLimit: 5 },
  ],
};
