const { Telegraf, Markup } = require("telegraf");
const fs = require("fs");

const bot = new Telegraf("8671819066:AAHsPLvizILvH56X44C-mwXzE_kWX0cg1vE");

// Load data
let games = JSON.parse(fs.readFileSync("games.json"));
let orders = JSON.parse(fs.readFileSync("orders.json"));

// 🔐 YOUR TELEGRAM ID (IMPORTANT)
const ADMIN_ID = "8672450847"; // replace with your Telegram ID

// SAVE FILES
function saveGames() {
  fs.writeFileSync("games.json", JSON.stringify(games, null, 2));
}

function saveOrders() {
  fs.writeFileSync("orders.json", JSON.stringify(orders, null, 2));
}

// START
bot.start((ctx) => {
  ctx.reply("🎮 Welcome! Use /shop to browse games");
});

// SHOP
bot.command("shop", (ctx) => {
  const buttons = games.map(game =>
    [Markup.button.callback(`${game.name} - ₹${game.price}`, `buy_${game.id}`)]
  );

  ctx.reply("🎮 Available Games:", Markup.inlineKeyboard(buttons));
});

// BUY
bot.action(/buy_(.+)/, (ctx) => {
  const gameId = ctx.match[1];
  const game = games.find(g => g.id === gameId);

  if (!game) return;

  if (game.keys.length === 0) {
    return ctx.reply("❌ Out of stock!");
  }

  // Take one key
  const key = game.keys.shift();
  saveGames();

  // Save order
  const order = {
    user: ctx.from.username || ctx.from.id,
    game: game.name,
    key: key,
    date: new Date()
  };

  orders.push(order);
  saveOrders();

  // Deliver instantly
  ctx.reply(
    `🎉 Purchase Successful!\n\n🎮 ${game.name}\n🔑 Key: ${key}\n\n⚡ Delivered instantly`
  );
});

// ➕ ADD GAME (ADMIN ONLY)
bot.command("addgame", (ctx) => {
  if (ctx.from.id !== ADMIN_ID) return ctx.reply("❌ Not allowed");

  ctx.reply("Send game in format:\nid,name,price,platform,key1,key2");
});

// HANDLE ADD GAME INPUT
bot.on("text", (ctx) => {
  if (ctx.from.id !== ADMIN_ID) return;

  if (ctx.message.text.includes(",")) {
    const data = ctx.message.text.split(",");

    const newGame = {
      id: data[0],
      name: data[1],
      price: Number(data[2]),
      platform: data[3],
      keys: data.slice(4)
    };

    games.push(newGame);
    saveGames();

    ctx.reply("✅ Game added successfully!");
  }
});

bot.launch();
console.log("🤖 Bot running...");