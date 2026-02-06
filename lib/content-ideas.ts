// Content Ideas Database Structure
// This will be expanded with real curated content

export type Niche = 
  | "home_food_vendor"
  | "street_food_seller"
  | "baker_cake_vendor"
  | "fashion_seller"
  | "beauty_hair_vendor"
  | "business_coach"
  | "online_vendor";

export type HookStyle = "story" | "question" | "shock" | "value" | "tip";
export type Format = "text_only" | "text_image" | "carousel" | "video";
export type NaijaTone = "mild" | "moderate" | "heavy";

export interface ContentIdea {
  id: string;
  niche: Niche;
  topic: string;
  hookStyle: HookStyle;
  hookExample: string;
  format: Format;
  naijaTone: {
    mild: string;
    moderate: string;
    heavy: string;
  };
  description?: string;
}

// Sample content ideas for MVP (will be expanded)
export const contentIdeasDatabase: ContentIdea[] = [
  // Home Food Vendor Ideas
  {
    id: "1",
    niche: "home_food_vendor",
    topic: "Quick breakfast ideas",
    hookStyle: "story",
    hookExample: "I used to skip breakfast until I discovered...",
    format: "text_image",
    naijaTone: {
      mild: "Quick breakfast ideas for busy mornings. Start your day right with these simple, nutritious options that take less than 10 minutes to prepare.",
      moderate: "Omo, breakfast no be joke o! See these quick breakfast ideas wey go make your morning sharp sharp. No time to waste, but you must chop well.",
      heavy: "See as I dey rush go work every morning, but I no fit skip breakfast. These quick ideas go help you chop well even when you dey rush."
    },
    description: "Share quick, easy breakfast recipes that busy people can make in minutes"
  },
  {
    id: "2",
    niche: "home_food_vendor",
    topic: "Nigerian jollof rice tips",
    hookStyle: "value",
    hookExample: "The secret to perfect jollof rice is...",
    format: "text_image",
    naijaTone: {
      mild: "The secret to perfect jollof rice is in the timing and spice blend. Here's how to get that authentic taste every time.",
      moderate: "Abeg, make I tell you the secret to perfect jollof rice. This one go make your jollof stand out for real.",
      heavy: "Omo, this jollof secret na gold! Make I share am with you so your jollof go dey sweet pass."
    },
    description: "Share cooking tips for making perfect Nigerian jollof rice"
  },
  {
    id: "3",
    niche: "home_food_vendor",
    topic: "Daily special announcement",
    hookStyle: "shock",
    hookExample: "Today's special: Fresh pepper soup ready!",
    format: "text_image",
    naijaTone: {
      mild: "Today's special: Fresh pepper soup ready! Limited quantity available. Order now to avoid missing out.",
      moderate: "Omo, today's special don ready! Fresh pepper soup wey go make you forget your name. Limited quantity o, make you order sharp sharp.",
      heavy: "See fresh pepper soup wey I just finish! This one go make you forget say you get problem. Limited quantity, make you order now now."
    },
    description: "Announce daily specials to create urgency and drive sales"
  },
  // Home Food Vendor - More Ideas
  {
    id: "hf4",
    niche: "home_food_vendor",
    topic: "Customer testimonial post",
    hookStyle: "story",
    hookExample: "Just got this message from a customer...",
    format: "text_image",
    naijaTone: {
      mild: "Just got this message from a customer: 'Your jollof rice is the best I've ever tasted!' Nothing makes me happier than seeing people enjoy my food. Thank you for the support!",
      moderate: "Omo, see message wey customer send me: 'Your jollof na fire!' This one dey make me happy pass. Thank you for supporting my small business.",
      heavy: "See message wey customer send me o! 'Your jollof dey sweet die!' This one dey make my heart dey happy. Thank you for supporting me."
    },
    description: "Share customer feedback to build trust and social proof"
  },
  {
    id: "hf5",
    niche: "home_food_vendor",
    topic: "Behind-the-scenes cooking process",
    hookStyle: "value",
    hookExample: "Ever wondered how I make my stew?",
    format: "carousel",
    naijaTone: {
      mild: "Ever wondered how I make my stew? Here's a quick behind-the-scenes look at my cooking process. Fresh ingredients, proper seasoning, and lots of love!",
      moderate: "Abeg, you don dey wonder how I dey make my stew? See small behind-the-scenes wey I snap. Fresh ingredients, proper seasoning, and love full ground!",
      heavy: "You dey wonder how I dey make my stew? See small behind-the-scenes o! Fresh ingredients, proper seasoning, and love full ground."
    },
    description: "Show your cooking process to build authenticity and trust"
  },
  {
    id: "hf6",
    niche: "home_food_vendor",
    topic: "Weekend special menu",
    hookStyle: "shock",
    hookExample: "This weekend's menu is ready!",
    format: "text_image",
    naijaTone: {
      mild: "This weekend's menu is ready! Special dishes available: Pepper soup, Jollof rice, Fried rice, and Grilled fish. Pre-orders welcome!",
      moderate: "Omo, this weekend menu don ready! Special dishes wey dey available: Pepper soup, Jollof rice, Fried rice, and Grilled fish. Pre-order dey welcome o!",
      heavy: "See weekend menu wey don ready! Special dishes: Pepper soup, Jollof rice, Fried rice, and Grilled fish. Pre-order dey welcome!"
    },
    description: "Announce weekend specials to drive weekend orders"
  },
  {
    id: "hf7",
    niche: "home_food_vendor",
    topic: "Healthy eating tip",
    hookStyle: "tip",
    hookExample: "Quick tip: Add vegetables to every meal",
    format: "text_only",
    naijaTone: {
      mild: "Quick tip: Add vegetables to every meal. Not only does it add color and flavor, but it also boosts your nutrition. Try adding spinach to your stew or carrots to your rice!",
      moderate: "Small tip: Make you add vegetables to every meal. E go make your food sweet pass and e go make you strong. Try add spinach to your stew or carrot to your rice!",
      heavy: "Small tip o: Add vegetables to every meal. E go make your food sweet pass and e go make you strong. Try am!"
    },
    description: "Share health tips to position yourself as knowledgeable"
  },
  {
    id: "hf8",
    niche: "home_food_vendor",
    topic: "Price transparency post",
    hookStyle: "value",
    hookExample: "Let's talk about pricing...",
    format: "text_only",
    naijaTone: {
      mild: "Let's talk about pricing. I use fresh, quality ingredients, and I believe in fair pricing. Here's why my prices reflect the quality you get.",
      moderate: "Make we talk about price small. I dey use fresh, quality ingredients, and I believe in fair price. See why my price dey like this.",
      heavy: "Make we talk about price. I dey use fresh ingredients, and I believe in fair price. See why my price dey like this."
    },
    description: "Be transparent about pricing to build trust"
  },

  // Street Food Seller Ideas
  {
    id: "sf1",
    niche: "street_food_seller",
    topic: "Location update",
    hookStyle: "shock",
    hookExample: "I'm at [Location] today!",
    format: "text_image",
    naijaTone: {
      mild: "I'm at Ikeja today! Come get your fresh suya, puff-puff, and buns. Look for the red umbrella. See you there!",
      moderate: "Omo, I dey Ikeja today o! Come get your fresh suya, puff-puff, and buns. Look for red umbrella. See you there!",
      heavy: "I dey Ikeja today! Come get your fresh suya, puff-puff, and buns. Look for red umbrella. See you there!"
    },
    description: "Update customers on your location to drive foot traffic"
  },
  {
    id: "sf2",
    niche: "street_food_seller",
    topic: "Quick snack recommendation",
    hookStyle: "question",
    hookExample: "What's your go-to street snack?",
    format: "text_image",
    naijaTone: {
      mild: "What's your go-to street snack? Mine is definitely suya with a cold drink. What about you? Drop your favorite in the comments!",
      moderate: "Wetin be your go-to street snack? Mine na suya with cold drink. Wetin be yours? Drop am for comment!",
      heavy: "Wetin be your go-to street snack? Mine na suya with cold drink. Drop am for comment!"
    },
    description: "Engage customers with questions to boost interaction"
  },
  {
    id: "sf3",
    niche: "street_food_seller",
    topic: "Price list announcement",
    hookStyle: "value",
    hookExample: "Updated price list for this week",
    format: "text_image",
    naijaTone: {
      mild: "Updated price list for this week: Suya - ₦500, Puff-puff (10 pieces) - ₦300, Buns - ₦200, Plantain chips - ₦400. All fresh daily!",
      moderate: "See updated price list for this week: Suya - ₦500, Puff-puff (10 pieces) - ₦300, Buns - ₦200, Plantain chips - ₦400. All fresh daily o!",
      heavy: "See price list: Suya - ₦500, Puff-puff (10 pieces) - ₦300, Buns - ₦200, Plantain chips - ₦400. All fresh daily!"
    },
    description: "Share prices to help customers plan their purchases"
  },
  {
    id: "sf4",
    niche: "street_food_seller",
    topic: "Fresh ingredients showcase",
    hookStyle: "story",
    hookExample: "Just got fresh ingredients from the market...",
    format: "carousel",
    naijaTone: {
      mild: "Just got fresh ingredients from the market this morning. Quality ingredients make quality food. That's my promise to you!",
      moderate: "Omo, I just come back from market with fresh ingredients this morning. Quality ingredients make quality food. That na my promise to you!",
      heavy: "I just come back from market with fresh ingredients. Quality ingredients make quality food. That na my promise!"
    },
    description: "Show fresh ingredients to build trust in quality"
  },
  {
    id: "sf5",
    niche: "street_food_seller",
    topic: "Rush hour special",
    hookStyle: "shock",
    hookExample: "Rush hour special! Quick grab-and-go",
    format: "text_image",
    naijaTone: {
      mild: "Rush hour special! Quick grab-and-go snacks ready. Perfect for busy people on the go. No waiting!",
      moderate: "Omo, rush hour special don ready! Quick grab-and-go snacks. Perfect for busy people. No waiting o!",
      heavy: "Rush hour special! Quick grab-and-go snacks. No waiting!"
    },
    description: "Create urgency during peak hours"
  },

  // Baker / Cake Vendor Ideas
  {
    id: "bc1",
    niche: "baker_cake_vendor",
    topic: "Custom cake order showcase",
    hookStyle: "story",
    hookExample: "Just finished this custom birthday cake...",
    format: "carousel",
    naijaTone: {
      mild: "Just finished this custom birthday cake for a client. Every cake tells a story, and I love bringing your vision to life. Order yours today!",
      moderate: "Omo, I just finish this custom birthday cake for client. Every cake get story, and I love make your vision come alive. Order yours today!",
      heavy: "I just finish this custom birthday cake. Every cake get story. Order yours today!"
    },
    description: "Showcase completed orders to attract new customers"
  },
  {
    id: "bc2",
    niche: "baker_cake_vendor",
    topic: "Baking tip of the day",
    hookStyle: "tip",
    hookExample: "Baking tip: Always preheat your oven",
    format: "text_only",
    naijaTone: {
      mild: "Baking tip: Always preheat your oven for at least 15 minutes before baking. This ensures even cooking and perfect results every time!",
      moderate: "Small baking tip: Make you preheat your oven for at least 15 minutes before you bake. This one go make your cake bake well well.",
      heavy: "Small tip: Preheat your oven for 15 minutes before you bake. E go make your cake bake well."
    },
    description: "Share baking knowledge to position as expert"
  },
  {
    id: "bc3",
    niche: "baker_cake_vendor",
    topic: "Price transparency for custom cakes",
    hookStyle: "value",
    hookExample: "How I price my custom cakes",
    format: "text_image",
    naijaTone: {
      mild: "How I price my custom cakes: Size, design complexity, and ingredients all factor in. Starting from ₦15,000. DM for a quote!",
      moderate: "See how I dey price my custom cakes: Size, design, and ingredients dey matter. Starting from ₦15,000. DM me for quote!",
      heavy: "How I dey price cakes: Size, design, and ingredients dey matter. Starting from ₦15,000. DM me!"
    },
    description: "Be transparent about pricing to set expectations"
  },
  {
    id: "bc4",
    niche: "baker_cake_vendor",
    topic: "Behind-the-scenes baking process",
    hookStyle: "story",
    hookExample: "This is how I make my cakes...",
    format: "video",
    naijaTone: {
      mild: "This is how I make my cakes. From mixing ingredients to final decoration, every step is done with care and attention to detail.",
      moderate: "See how I dey make my cakes. From mixing ingredients to final decoration, every step dey important. I dey do am with care.",
      heavy: "See how I dey make cakes. Every step dey important. I dey do am with care."
    },
    description: "Show your process to build authenticity"
  },
  {
    id: "bc5",
    niche: "baker_cake_vendor",
    topic: "Celebration cake ideas",
    hookStyle: "question",
    hookExample: "What kind of cake do you want for your celebration?",
    format: "carousel",
    naijaTone: {
      mild: "What kind of cake do you want for your celebration? Birthday, wedding, anniversary - I've got you covered. Check out these ideas!",
      moderate: "Wetin be the kind of cake you want for your celebration? Birthday, wedding, anniversary - I get you covered. See these ideas!",
      heavy: "Wetin be the cake you want? Birthday, wedding, anniversary - I get you covered!"
    },
    description: "Show variety to help customers choose"
  },

  // Fashion Seller Ideas
  {
    id: "fs1",
    niche: "fashion_seller",
    topic: "Outfit of the day",
    hookStyle: "story",
    hookExample: "Today's outfit inspiration...",
    format: "carousel",
    naijaTone: {
      mild: "Today's outfit inspiration: Mix and match pieces to create a unique look. Fashion is about expressing yourself!",
      moderate: "See today outfit inspiration: Mix and match pieces to create unique look. Fashion na about expressing yourself!",
      heavy: "See today outfit! Mix and match to create unique look. Fashion na about expressing yourself!"
    },
    description: "Show daily outfit ideas to inspire customers"
  },
  {
    id: "fs2",
    niche: "fashion_seller",
    topic: "New arrival announcement",
    hookStyle: "shock",
    hookExample: "New arrivals just dropped!",
    format: "carousel",
    naijaTone: {
      mild: "New arrivals just dropped! Fresh styles, latest trends, and quality pieces. Check them out before they're gone!",
      moderate: "Omo, new arrivals just drop! Fresh styles, latest trends, and quality pieces. Check them before dem finish!",
      heavy: "New arrivals don drop! Fresh styles and latest trends. Check them now!"
    },
    description: "Create urgency with new arrivals"
  },
  {
    id: "fs3",
    niche: "fashion_seller",
    topic: "Styling tip",
    hookStyle: "tip",
    hookExample: "Styling tip: Accessorize to elevate your look",
    format: "text_image",
    naijaTone: {
      mild: "Styling tip: Accessorize to elevate your look. A simple outfit becomes stunning with the right accessories. Less is more!",
      moderate: "Small styling tip: Add accessories to make your look better. Simple outfit go become stunning with right accessories.",
      heavy: "Small tip: Add accessories to make your look better. Simple outfit go become stunning!"
    },
    description: "Share styling knowledge to build authority"
  },
  {
    id: "fs4",
    niche: "fashion_seller",
    topic: "Customer transformation",
    hookStyle: "story",
    hookExample: "Before and after styling session",
    format: "carousel",
    naijaTone: {
      mild: "Before and after styling session with a client. Sometimes all you need is the right pieces to feel confident and beautiful!",
      moderate: "See before and after styling session with client. Sometimes all you need na right pieces to feel confident and beautiful!",
      heavy: "See before and after! Right pieces go make you feel confident and beautiful!"
    },
    description: "Show transformations to demonstrate value"
  },
  {
    id: "fs5",
    niche: "fashion_seller",
    topic: "Price range announcement",
    hookStyle: "value",
    hookExample: "Affordable fashion for everyone",
    format: "text_image",
    naijaTone: {
      mild: "Affordable fashion for everyone. Quality pieces at great prices. Starting from ₦5,000. Style doesn't have to break the bank!",
      moderate: "Affordable fashion for everyone. Quality pieces at good prices. Starting from ₦5,000. Style no need to cost arm and leg!",
      heavy: "Affordable fashion! Quality pieces. Starting from ₦5,000. Style no need to cost too much!"
    },
    description: "Highlight affordability to attract price-conscious customers"
  },

  // Beauty / Hair Vendor Ideas
  {
    id: "bh1",
    niche: "beauty_hair_vendor",
    topic: "Before and after transformation",
    hookStyle: "shock",
    hookExample: "Look at this transformation!",
    format: "carousel",
    naijaTone: {
      mild: "Look at this transformation! From damaged hair to healthy, beautiful locks. Book your appointment today!",
      moderate: "Omo, see this transformation! From damaged hair to healthy, beautiful hair. Book your appointment today!",
      heavy: "See this transformation! From damaged hair to beautiful hair. Book your appointment!"
    },
    description: "Show transformations to attract new clients"
  },
  {
    id: "bh2",
    niche: "beauty_hair_vendor",
    topic: "Booking reminder",
    hookStyle: "value",
    hookExample: "Don't forget to book your appointment",
    format: "text_only",
    naijaTone: {
      mild: "Don't forget to book your appointment! Slots are filling up fast. Book now to secure your preferred time.",
      moderate: "Make you no forget to book your appointment! Slots dey finish fast. Book now to secure your time.",
      heavy: "Book your appointment! Slots dey finish fast. Book now!"
    },
    description: "Remind clients to book to maintain steady bookings"
  },
  {
    id: "bh3",
    niche: "beauty_hair_vendor",
    topic: "Hair care tip",
    hookStyle: "tip",
    hookExample: "Hair care tip: Moisturize daily",
    format: "text_image",
    naijaTone: {
      mild: "Hair care tip: Moisturize daily to keep your hair healthy and strong. Healthy hair starts with proper care!",
      moderate: "Small hair care tip: Make you moisturize daily to keep your hair healthy and strong. Healthy hair start with proper care!",
      heavy: "Small tip: Moisturize daily to keep your hair healthy. Healthy hair start with proper care!"
    },
    description: "Share hair care knowledge to build trust"
  },
  {
    id: "bh4",
    niche: "beauty_hair_vendor",
    topic: "Style trend showcase",
    hookStyle: "story",
    hookExample: "This style is trending right now...",
    format: "carousel",
    naijaTone: {
      mild: "This style is trending right now. Want to try it? Book an appointment and let's create this look for you!",
      moderate: "See style wey dey trend now. You want try am? Book appointment make we create this look for you!",
      heavy: "See trending style! Book appointment make we create this look for you!"
    },
    description: "Show trending styles to attract trend-conscious clients"
  },
  {
    id: "bh5",
    niche: "beauty_hair_vendor",
    topic: "Client testimonial",
    hookStyle: "story",
    hookExample: "Just got this feedback from a client...",
    format: "text_image",
    naijaTone: {
      mild: "Just got this feedback from a client: 'Best hair service I've ever had!' Thank you for trusting me with your hair. Your satisfaction is my priority!",
      moderate: "Omo, see feedback wey client send me: 'Best hair service ever!' Thank you for trusting me. Your satisfaction na my priority!",
      heavy: "See feedback from client: 'Best hair service ever!' Thank you for trusting me!"
    },
    description: "Share testimonials to build social proof"
  },

  // Business / Coach Ideas
  {
    id: "co1",
    niche: "business_coach",
    topic: "Motivational Monday quote",
    hookStyle: "value",
    hookExample: "Monday motivation: Start your week strong",
    format: "text_image",
    naijaTone: {
      mild: "Monday motivation: Start your week strong. Your success is determined by your daily actions. Make today count!",
      moderate: "Monday motivation: Start your week strong. Your success dey depend on your daily actions. Make today count!",
      heavy: "Monday motivation: Start your week strong. Your success dey depend on your daily actions!"
    },
    description: "Share weekly motivation to engage audience"
  },
  {
    id: "co2",
    niche: "business_coach",
    topic: "Business tip of the day",
    hookStyle: "tip",
    hookExample: "Business tip: Focus on one thing at a time",
    format: "text_only",
    naijaTone: {
      mild: "Business tip: Focus on one thing at a time. Multitasking reduces productivity. Master one skill, then move to the next.",
      moderate: "Small business tip: Focus on one thing at a time. Multitasking no good. Master one skill, then move to next.",
      heavy: "Small tip: Focus on one thing. Multitasking no good. Master one skill first!"
    },
    description: "Share actionable business tips"
  },
  {
    id: "co3",
    niche: "business_coach",
    topic: "Success story",
    hookStyle: "story",
    hookExample: "Here's how my client achieved success...",
    format: "text_image",
    naijaTone: {
      mild: "Here's how my client achieved success: Started small, stayed consistent, and never gave up. Success is a journey, not a destination.",
      moderate: "See how my client achieve success: Start small, stay consistent, and no give up. Success na journey, no be destination.",
      heavy: "See how client achieve success: Start small, stay consistent, no give up!"
    },
    description: "Share success stories to inspire and attract clients"
  },
  {
    id: "co4",
    niche: "business_coach",
    topic: "Daily challenge",
    hookStyle: "question",
    hookExample: "Today's challenge: What's one thing you'll do differently?",
    format: "text_only",
    naijaTone: {
      mild: "Today's challenge: What's one thing you'll do differently today to move closer to your goals? Share in the comments!",
      moderate: "Today challenge: Wetin be one thing you go do differently today to move closer to your goals? Share for comment!",
      heavy: "Today challenge: Wetin you go do differently today? Share for comment!"
    },
    description: "Engage audience with daily challenges"
  },
  {
    id: "co5",
    niche: "business_coach",
    topic: "Coaching service announcement",
    hookStyle: "value",
    hookExample: "Ready to take your business to the next level?",
    format: "text_image",
    naijaTone: {
      mild: "Ready to take your business to the next level? I'm offering 1-on-1 coaching sessions. Limited slots available. DM to book!",
      moderate: "You ready to take your business to next level? I dey offer 1-on-1 coaching sessions. Limited slots dey available. DM to book!",
      heavy: "Ready to take your business to next level? I dey offer coaching. DM to book!"
    },
    description: "Promote coaching services to generate leads"
  },

  // Online Vendor (IG Shop) Ideas
  {
    id: "ov1",
    niche: "online_vendor",
    topic: "Flash sale announcement",
    hookStyle: "shock",
    hookExample: "Flash sale! Limited time only",
    format: "text_image",
    naijaTone: {
      mild: "Flash sale! Limited time only. 20% off on selected items. First 10 customers get free delivery. Don't miss out!",
      moderate: "Omo, flash sale don start! Limited time only. 20% off on selected items. First 10 customers get free delivery. No miss am!",
      heavy: "Flash sale! 20% off. First 10 customers get free delivery. No miss am!"
    },
    description: "Create urgency with flash sales"
  },
  {
    id: "ov2",
    niche: "online_vendor",
    topic: "Product highlight",
    hookStyle: "value",
    hookExample: "This product is a game-changer",
    format: "carousel",
    naijaTone: {
      mild: "This product is a game-changer. Quality, affordable, and delivers results. Check it out in my bio link!",
      moderate: "See product wey be game-changer. Quality, affordable, and e dey deliver results. Check am for my bio link!",
      heavy: "See product wey be game-changer! Quality and affordable. Check am for my bio link!"
    },
    description: "Highlight specific products to drive sales"
  },
  {
    id: "ov3",
    niche: "online_vendor",
    topic: "Customer review showcase",
    hookStyle: "story",
    hookExample: "See what customers are saying...",
    format: "text_image",
    naijaTone: {
      mild: "See what customers are saying: 'Fast delivery and quality products!' Your satisfaction is my priority. Shop now!",
      moderate: "See wetin customers dey talk: 'Fast delivery and quality products!' Your satisfaction na my priority. Shop now!",
      heavy: "See wetin customers dey talk! Fast delivery and quality. Shop now!"
    },
    description: "Show customer reviews to build trust"
  },
  {
    id: "ov4",
    niche: "online_vendor",
    topic: "WhatsApp order reminder",
    hookStyle: "value",
    hookExample: "Order via WhatsApp for faster service",
    format: "text_only",
    naijaTone: {
      mild: "Order via WhatsApp for faster service. Send me a message with what you need, and I'll respond immediately. Link in bio!",
      moderate: "Make you order via WhatsApp for faster service. Send me message with wetin you need, I go reply immediately. Link for bio!",
      heavy: "Order via WhatsApp! Send message, I go reply immediately. Link for bio!"
    },
    description: "Encourage WhatsApp orders for better conversion"
  },
  {
    id: "ov5",
    niche: "online_vendor",
    topic: "New product launch",
    hookStyle: "shock",
    hookExample: "New product just arrived!",
    format: "carousel",
    naijaTone: {
      mild: "New product just arrived! Fresh stock, limited quantity. Get yours before it's sold out. DM to order!",
      moderate: "Omo, new product just arrive! Fresh stock, limited quantity. Get yours before e finish. DM to order!",
      heavy: "New product don arrive! Limited quantity. Get yours now! DM to order!"
    },
    description: "Announce new arrivals to create excitement"
  },
];

// Get content ideas for a specific niche
export function getContentIdeasForNiche(niche: Niche, limit: number = 5): ContentIdea[] {
  return contentIdeasDatabase
    .filter(idea => idea.niche === niche)
    .slice(0, limit);
}

// Get daily content ideas (rotates based on date)
export function getDailyContentIdeas(niche: Niche, count: number = 5): ContentIdea[] {
  const allIdeas = contentIdeasDatabase.filter(idea => idea.niche === niche);
  
  // Simple rotation based on day of year
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
  const startIndex = dayOfYear % allIdeas.length;
  
  const rotated = [
    ...allIdeas.slice(startIndex),
    ...allIdeas.slice(0, startIndex)
  ];
  
  return rotated.slice(0, count);
}
