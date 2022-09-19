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
  "whiteOnBlackBlue": {
    "background": "#000000",
    "foreground": "#ffffff",
    "foregroundAlt": "#00aaea",
    "highlightBackground": "#00aaea",
    "highlightForeground": "#000000",
    "sidebarBackground": "#000000",
    "sidebarForeground": "#ffffff",
    "sidebarButtonBackground": "#000000",
    "sidebarButtonForeground": "#ffffff",
    "windowBackground": "#000000"
  },
  "whiteOnBlackPink": {
    "background": "#000000",
    "foreground": "#ffffff",
    "foregroundAlt": "#FF3EB5",
    "highlightBackground": "#FF3EB5",
    "highlightForeground": "#000000",
    "sidebarBackground": "#000000",
    "sidebarForeground": "#ffffff",
    "sidebarButtonBackground": "#000000",
    "sidebarButtonForeground": "#ffffff",
    "windowBackground": "#000000"
  },
};

VG.flagScope = "vastgrimm";  // must match system name

VG.flags = {
  ATTACK_DR: "attackDR",
  DEFEND_DR: "defendDR",
  INCOMING_ATTACK: "incomingAttack",
  TARGET_ARMOR: "targetArmor"
}

VG.fontSchemes = {
  "sci-fi": {
    "chat": "helvetica",
    "chatInfo": "helvetica",
    "h1": "Takota",
    "h2": "Lazenby Computer",
    "h3": "Audiowide",
    "item": "Special Elite"
  },
  "legible": {
    "chat": "helvetica",
    "chatInfo": "helvetica",
    "h1": "helvetica",
    "h2": "helvetica",
    "h3": "helvetica",
    "item": "helvetica"
  }
};

VG.itemTypes = {
  ammo: "ammo",
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
  "ammo": "VG.ItemTypeAmmo",
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
  VG.itemTypes.ammo,
  VG.itemTypes.armor,
  VG.itemTypes.consumable,
  VG.itemTypes.container,
  VG.itemTypes.helmet,
  VG.itemTypes.misc,
  VG.itemTypes.pharmaceutical,
  VG.itemTypes.tribute,
  VG.itemTypes.weapon,
];

VG.plusMinusItemTypes = [VG.itemTypes.ammo, VG.itemTypes.misc];

VG.tributeTypes = {
  "encrypted": "VG.TributeTypeEncrypted",
  "hacked": "VG.TributeTypeHacked"
};

VG.weaponTypes = {
  "melee": "VG.WeaponTypeMelee",
  "ranged": "VG.WeaponTypeRanged"
};