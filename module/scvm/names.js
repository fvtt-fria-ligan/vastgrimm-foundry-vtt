const names = [
  "Akar",
  "Avax",
  "Axtin",
  "Bennett",
  "Buck",
  "Codex",
  "Coro",
  "Crowbar",
  "Cynder",
  "Deavar",
  "Durrek",
  "Ender",
  "Eclipse",
  "Fang",
  "Fiver",
  "Flik",
  "Gavr",
  "Gideon",
  "Gridor",
  "Hazel",
  "Hunter",
  "Jinx",
  "Kerrud",
  "Knuckles",
  "Kruel",
  "Mara",
  "Lunar",
  "Mani",
  "Nalex",
  "Perra",
  "Padar",
  "Ratchet",
  "Ripper",
  "Syrus",
  "Saria",
  "Savaj",
  "Selor",
  "Syntax",
  "Tiabak",
  "Thoria",
  "Thrasher",
  "Torch",
  "Valria",
  "Valbak",
  "Wort",
  "Xian",
  "Zandar",
  "Zero",
];

export const randomName = () => {
  return names[Math.floor(Math.random() * names.length)];
};