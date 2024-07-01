import { VGActor } from "../actor/actor.js";
import { VG } from "../config.js";
import { VGItem } from "../item/item.js";
import { randomName } from "./names.js";
import { sample } from "../utils.js";
import { rollTotal } from "../utils.js";
import {
  documentFromPack,
  documentFromResult,
  documentsFromDraw,
  drawDocumentsFromTableUuid,
  drawFromTableUuid,
  drawTextFromTableUuid,
} from "../packutils.js";

export async function createRandomScvm() {
  const clazz = await pickRandomClass();
  await createScvm(clazz);
}

export async function createScvm(clazz) {
  const scvm = await rollScvmForClass(clazz);
  await createActorWithScvm(scvm);
}

export async function scvmifyActor(actor, clazz) {
  const scvm = await rollScvmForClass(clazz);
  await updateActorWithScvm(actor, scvm);
}

async function pickRandomClass() {
  const uuid = sample(VG.scvmFactory.classUuids);
  const clazz = await fromUuid(uuid);
  return clazz;
}

export async function findClasses() {
  const classes = [];
  for (let uuid of VG.scvmFactory.classUuids) {
    const clazz = await fromUuid(uuid);
    classes.push(clazz);
  }
  return classes;
}

async function startingEquipment() {
  const docs = [];
  // 3 starting equipment tables
  if (VG.scvmFactory.startingEquipmentTable1) {
    const eq1 = await drawDocumentsFromTableUuid(
      VG.scvmFactory.startingEquipmentTable1
    );
    docs.push(...eq1);
  }
  if (VG.scvmFactory.startingEquipmentTable2) {
    const eq2 = await drawDocumentsFromTableUuid(
      VG.scvmFactory.startingEquipmentTable2
    );
    docs.push(...eq2);
  }
  if (VG.scvmFactory.startingEquipmentTable3) {
    const eq3 = await drawDocumentsFromTableUuid(
      VG.scvmFactory.startingEquipmentTable3
    );
    docs.push(...eq3);
  }
  return docs;
};

async function startingWeapons(clazz, rolledTribute) {
  const docs = [];
  if (VG.scvmFactory.startingWeaponTable && clazz.system.weaponTableDie) {
    let weaponDie = clazz.system.weaponTableDie;
    if (rolledTribute) {
      // TODO: this check for "is it a higher die roll" assumes a d10 weapon table,
      // and doesn't handle not having a leading 1 in the string
      if (weaponDie === "1d8" || weaponDie === "2d4" || weaponDie === "1d10") {
        weaponDie = VG.scvmFactory.weaponDieIfRolledTribute;
      }
    }
    const draw = await drawFromTableUuid(
      VG.scvmFactory.startingWeaponTable,
      weaponDie
    );
    const weapons = await documentsFromDraw(draw);
    docs.push(...weapons);
  }
  return docs;
};

async function startingArmor(clazz, rolledTribute) {
  const docs = [];
  if (VG.scvmFactory.startingArmorTable && clazz.system.armorTableDie) {
    let armorDie = clazz.system.armorTableDie;
    if (rolledTribute) {
      // TODO: this check for "is it a higher die roll" assumes a d4 armor table
      // and doesn't handle not having a leading 1 in the string
      if (armorDie === "1d3" || armorDie === "1d4") {
        armorDie = VG.scvmFactory.armorDieIfRolledTribute;
      }
    }
    const draw = await drawFromTableUuid(
      VG.scvmFactory.startingArmorTable,
      armorDie
    );
    const armor = await documentsFromDraw(draw);
    docs.push(...armor);
  }
  return docs;
};

async function startingClassItems(clazz) {
  const docs = [];
  if (clazz.system.startingItems) {
    const lines = clazz.system.startingItems.split("\n");
    for (const line of lines) {
      const [packName, itemName] = line.split(",");
      const item = await documentFromPack(packName, itemName);
      docs.push(item);
    }
  }
  return docs;
};

async function startingDescriptionLines(clazz) {
  // start accumulating character description, starting with the class description
  const descriptionLines = [];
  descriptionLines.push(clazz.system.description);
  descriptionLines.push("<p>&nbsp;</p>");

  let descriptionLine = "";
  if (VG.scvmFactory.misspentYouthTable) {
    const misspentYouth1 = await drawTextFromTableUuid(
      VG.scvmFactory.misspentYouthTable
    );
    const misspentYouth2 = await drawTextFromTableUuid(
      VG.scvmFactory.misspentYouthTable
    );
    // Battle Scars and Idiosyncrasies end with a period, but Misspent Youth entries don't.
    descriptionLine += `${misspentYouth1} and ${misspentYouth2
      .charAt(0)
      .toLowerCase()}${misspentYouth2.slice(1)}.`;
  }
  if (VG.scvmFactory.battleScarTable) {
    const battleScars = await drawTextFromTableUuid(
      VG.scvmFactory.battleScarsTable
    );
    descriptionLine += ` ${battleScar}`;
  }
  if (VG.scvmFactory.idiosyncrasyTable) {
    const idiosyncrasy = await drawTextFromTableUuid(VG.scvmFactory.idiosyncrasyTable);
    descriptionLine += ` ${idiosyncrasy}`;
  }
  if (descriptionLine) {
    descriptionLines.push(descriptionLine);
    descriptionLines.push("<p>&nbsp;</p>");
  }
  return descriptionLines;
};

async function startingRollItemsAndDescriptionLines(clazz) {
  // class-specific starting rolls
  const rollItems = [];
  const rollDescriptionLines = [];
  if (clazz.system.startingRolls) {
    const lines = clazz.system.startingRolls.split("\n");
    for (const line of lines) {
      const [packName, tableName, rolls] = line.split(",");
      // assume 1 roll unless otherwise specified in the csv
      const numRolls = rolls ? parseInt(rolls) : 1;
      const pack = game.packs.get(packName);
      if (pack) {
        const content = await pack.getDocuments();
        const table = content.find((i) => i.name === tableName);
        if (table) {
          const results = await compendiumTableDrawMany(table, numRolls);
          for (const result of results) {
            // draw result type
            if (result.type === CONST.TABLE_RESULT_TYPES.TEXT) {
              // text
              rollDescriptionLines.push(`<p>${table.name}: ${result.text}</p>`);
            } else if (result.type === CONST.TABLE_RESULT_TYPES.DOCUMENT) {
              // entity
              // TODO: what do we want to do here?
            } else if (result.type === CONST.TABLE_RESULT_TYPES.COMPENDIUM) {
              // compendium
              const doc = await documentFromResult(result);
              rollItems.push(doc);
            }
          }
        } else {
          console.log(`Could not find RollTable ${tableName}`);
        }
      } else {
        console.log(`Could not find compendium ${packName}`);
      }
    }
  }
  return {
    rollDescriptionLines,
    rollItems,
  };
};

async function rollScvmForClass(clazz) {
  const name = randomName() + " " + randomName();
  const credits = await rollTotal(clazz.system.startingCredits || "0");
  const favors = await rollTotal(clazz.system.favorDie);
  const baseHitPoints = await rollTotal(clazz.system.startingHitPoints);
  const baseNeuromancyPoints = await rollTotal("1d4");

  const strength = await abilityRoll(clazz.system.startingStrength);
  const agility = await abilityRoll(clazz.system.startingAgility);
  const presence = await abilityRoll(clazz.system.startingPresence);
  const toughness = await abilityRoll(clazz.system.startingToughness);
  const hitPoints = Math.max(1, baseHitPoints + toughness);
  const neuromancyPoints = Math.max(0, baseNeuromancyPoints + presence);
  const allDocs = [clazz];

  const equipment = await startingEquipment();
  allDocs.push(...equipment);
  const rolledTribute = allDocs.filter((i) => i?.type === "tribute").length > 0;

  const weapons = await startingWeapons(clazz, rolledTribute);
  allDocs.push(...weapons);

  const armor = await startingArmor(clazz, rolledTribute);
  allDocs.push(...armor);
  
  const classItems = await startingClassItems(clazz);
  allDocs.push(...classItems);

  // start accumulating character description
  const descriptionLines = await startingDescriptionLines(clazz);
  const { rollDescriptionLines, rollItems } =
    await startingRollItemsAndDescriptionLines(clazz);
  descriptionLines.push(...rollDescriptionLines);
  allDocs.push(...rollItems);

  const items = allDocs.filter((e) => e instanceof VGItem);
  const itemData = items.map((i) => simpleData(i));
  const actors = allDocs.filter((e) => e instanceof VGActor);
  const actorData = actors.map((e) => simpleData(e));

  return {
    actorImg: clazz.img,
    actors: actorData,
    agility,
    credits,
    description: descriptionLines.join(""),
    favors,
    hitPoints,
    items: itemData,
    name,
    neuromancyPoints,
    presence,
    strength,
    tokenImg: clazz.img,
    toughness,
  };
}

function simpleData(item) {
  return {
    img: item.img,
    name: item.name,
    system: item.system,
    type: item.type,
  };
}

function scvmToActorData(s) {
  return {
    name: s.name,
    system: {
      abilities: {
        strength: { value: s.strength },
        agility: { value: s.agility },
        presence: { value: s.presence },
        toughness: { value: s.toughness },
      },
      credits: s.credits,
      description: s.description,
      hp: {
        max: s.hitPoints,
        value: s.hitPoints,
      },
      favors: {
        max: s.favors,
        value: s.favors,
      },
      neuromancyPoints: {
        max: s.neuromancyPoints,
        value: s.neuromancyPoints,
      },
    },
    img: s.actorImg,
    items: s.items,
    flags: {},
    prototypeToken: {
      name: s.name,
      texture: {
        src: s.actorImg,
      },
    },
    type: "character",    
  };
}

async function createActorWithScvm(s) {
  const data = scvmToActorData(s);
  console.log("scum", s);
  console.log("actorData", data);
  // use VGActor.create() so we get default disposition, actor link, vision, etc
  const actor = await VGActor.create(data);
  actor.sheet.render(true);
}

async function updateActorWithScvm(actor, s) {
  const data = scvmToActorData(s);
  // Explicitly nuke all items before updating.
  // Before Foundry 0.8.x, actor.update() used to overwrite items,
  // but now doesn't. Maybe because we're passing items: [item.data]?
  // Dunno.
  await actor.deleteEmbeddedDocuments("Item", [], { deleteAll: true });
  await actor.update(data);
}

async function abilityRoll(formula) {
  const total = await rollTotal(formula);
  return abilityBonus(total);
}

const abilityBonus = (rollTotal) => {
  if (rollTotal <= 4) {
    return -3;
  } else if (rollTotal <= 6) {
    return -2;
  } else if (rollTotal <= 8) {
    return -1;
  } else if (rollTotal <= 12) {
    return 0;
  } else if (rollTotal <= 14) {
    return 1;
  } else if (rollTotal <= 16) {
    return 2;
  } else {
    // 17 - 20+
    return 3;
  }
};

/** Workaround for compendium RollTables not honoring replacement=false */
const compendiumTableDrawMany = async (rollTable, numDesired) => {
  let rollTotals = [];
  let results = [];
  while (rollTotals.length < numDesired) {
    const tableDraw = await rollTable.draw({ displayChat: false });
    if (rollTotals.includes(tableDraw.roll.total)) {
      // already rolled this, so roll again
      continue;
    }
    rollTotals.push(tableDraw.roll.total);
    results = results.concat(tableDraw.results);
  }
  return results;
};
