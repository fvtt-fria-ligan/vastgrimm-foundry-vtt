// Namespace Configuration Values
export const VG = {};// Namespace Configuration Values

VG.abilities = {
  "agility": "VG.AbilityAgility",
  "presence": "VG.AbilityPresence",
  "strength": "VG.AbilityStrength",
  "toughness": "VG.AbilityToughness"
};

VG.armorTiers = {
  0: {
    key: "VG.ArmorTierNone",
    damageReductionDie: "1d0",
    agilityModifier: 0,
    defenseModifier: 0
  },
  1: {
    key: "VG.ArmorTierLight",
    damageReductionDie: "1d2",
    agilityModifier: 0,
    defenseModifier: 0
  },
  2: {
    key: "VG.ArmorTierMedium",
    damageReductionDie: "1d4",
    agilityModifier: 2,
    defenseModifier: 2
  },
  3: {
    key: "VG.ArmorTierHeavy",
    damageReductionDie: "1d6",
    agilityModifier: 4,
    defenseModifier: 2
  },
};

VG.colorSchemes = {
  "blackOnYellowWhite": {
    "background": "#ffe900",
    "foreground": "#000000",
    "foregroundAlt": "#808080",
    "highlightBackground": "#ffffff",
    "highlightForeground": "#000000",
    "sidebarBackground": "#ffe900",
    "sidebarForeground": "000000",
    "sidebarButtonBackground": "#000000",
    "sidebarButtonForeground": "#ffe900",
    "windowBackground": "#ffe900"
  },
  "blackOnWhiteBlack": {
    "background": "#ffffff",
    "foreground": "#000000",
    "foregroundAlt": "#808080",
    "highlightBackground": "#000000",
    "highlightForeground": "#ffffff",
    "sidebarBackground": "#ffffff",
    "sidebarForeground": "#000000",
    "sidebarButtonBackground": "#000000",
    "sidebarButtonForeground": "#ffffff",
    "windowBackground": "#ffffff"
  },
  "foundryDefault": {
    "background": "#f0f0e0",
    "foreground": "#191813",
    "foregroundAlt": "red",
    "highlightBackground": "#191813",
    "highlightForeground": "#f0f0e0",
    "sidebarBackground": "url(../ui/denim.jpg) repeat",
    "sidebarForeground": "#f0f0e0",
    "sidebarButtonBackground": "#f0f0e0",
    "sidebarButtonForeground": "#000000",
    "windowBackground": "url(../ui/parchment.jpg) repeat"
  },
  "whiteOnBlackYellow": {
    "background": "#000000",
    "foreground": "#ffffff",
    "foregroundAlt": "#ffe900",
    "highlightBackground": "#ffe900",
    "highlightForeground": "#000000",
    "sidebarBackground": "#000000",
    "sidebarForeground": "#ffffff",
    "sidebarButtonBackground": "#ffffff",
    "sidebarButtonForeground": "#000000",
    "windowBackground": "#000000"
  },
  "whiteOnBlackPink": {
    "background": "#000000",
    "foreground": "#ffffff",
    "foregroundAlt": "#ff3eb5",
    "highlightBackground": "#ff3eb5",
    "highlightForeground": "#000000",
    "sidebarBackground": "#000000",
    "sidebarForeground": "#ffffff",
    "sidebarButtonBackground": "#ffffff",
    "sidebarButtonForeground": "#000000",
    "windowBackground": "#000000"
  },
  "whiteOnPinkWhite": {
    "background": "#ff3eb5",
    "foreground": "#ffffff",
    "foregroundAlt": "#000000",
    "highlightBackground": "#ffffff",
    "highlightForeground": "#000000",
    "sidebarBackground": "#ff3eb5",
    "sidebarForeground": "#ffffff",
    "sidebarButtonBackground": "#ffffff",
    "sidebarButtonForeground": "#ff3eb5",
    "windowBackground": "#ff3eb5"
  }
};

VG.flagScope = "vastgrimm";  // must match system name

VG.flags = {
  ATTACK_DR: "attackDR",
  DEFEND_DR: "defendDR",
  INCOMING_ATTACK: "incomingAttack",
  TARGET_ARMOR: "targetArmor"
}

VG.fontSchemes = {
  "blackletter": {
    "chat": "Alegreya",
    "chatInfo": "Oswald",
    "h1": "Blood Crow",
    "h2": "FetteTrumpDeutsch",
    "h3": "Old Cupboard",
    "item": "Special Elite"
  },
  "legible": {
    "chat": "Alegreya",
    "chatInfo": "Oswald",
    "h1": "Blood Crow",
    "h2": "Calling Code Regular",
    "h3": "Old Cupboard",
    "item": "Lato"
  }
};

VG.handed = {
  1: "VG.HandedOne",
  2: "VG.HandedTwo"
};

VG.itemTypes = {
  armor: "armor",
  class: "class",
  consumable: "consumable",
  container: "container",
  helmet: "helmet",
  misc: "misc",
  parasite: "parasite",
  pharmaceutical: "pharmaceutical",
  skill: "skill",
  tribute: "tribute",
  weapon: "weapon"
};

VG.itemTypeKeys = {
  "armor": "VG.ItemTypeArmor",
  "class": "VG.ItemTypeClass",
  "container": "VG.ItemTypeContainer",
  "helmet": "VG.ItemTypeHelmet",
  "misc": "VG.ItemTypeMisc",
  "parasite": "VG.ItemTypeParasite",
  "pharmaceutical": "VG.ItemTypePharmaceutical",
  "skill": "VG.ItemTypeSkill",
  "tribute": "VG.ItemTypeTribute",
  "weapon": "VG.ItemTypeWeapon"  
};

// these Item types are "equipment"
VG.itemEquipmentTypes = [
  VG.itemTypes.armor,
  VG.itemTypes.consumable,
  VG.itemTypes.container,
  VG.itemTypes.helmet,
  VG.itemTypes.misc,
  VG.itemTypes.tribute,
  VG.itemTypes.weapon,
];

VG.tributeTypes = {
  "encrypted": "VG.TributeTypeEncrypted",
  "hacked": "VG.TributeTypeHacked"
};

VG.weaponTypes = {
  "melee": "VG.WeaponTypeMelee",
  "ranged": "VG.WeaponTypeRanged"
};