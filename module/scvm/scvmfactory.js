import {VGActor} from "../actor/actor.js";
import { VG } from "../config.js";
import {VGItem} from "../item/item.js";
import {randomName} from "./names.js";
import { TABLES_PACK } from "../packutils.js";
import { sample } from "../utils.js";

export const createRandomScvm = async () => {
    const clazz = await pickRandomClass();
    await createScvm(clazz);
};

export const createScvm = async (clazz) => {
    const scvm = await rollScvmForClass(clazz);
    await createActorWithScvm(scvm);
};

export const scvmifyActor = async (actor, clazz) => {
    const scvm = await rollScvmForClass(clazz);
    await updateActorWithScvm(actor, scvm);
};

const pickRandomClass = async () => {
  const uuid = sample(VG.scvmFactory.classUuids);
  const clazz = await fromUuid(uuid);
  return clazz;
};

export const findClasses = async () => {
  const classes = [];
  for (let uuid of VG.scvmFactory.classUuids) {
    const clazz = await fromUuid(uuid);
    classes.push(clazz);
  }
  return classes;
}

const rollScvmForClass = async (clazz) => {
    console.log(`Creating new ${clazz.name}`);

    let credits = 0;
    if (clazz.system.startingCredits) {
        const creditsRoll = new Roll(clazz.system.startingCredits).evaluate({async: false});
        credits = creditsRoll.total;
    }
    const favorsRoll = new Roll(clazz.system.favorDie).evaluate({async: false});
    const hpRoll = new Roll(clazz.system.startingHitPoints).evaluate({async: false});
    const neuromancyPointsRoll = new Roll("1d4").evaluate({async: false});

    const strRoll = new Roll(clazz.system.startingStrength).evaluate({async: false});
    const strength = abilityBonus(strRoll.total);
    const agiRoll = new Roll(clazz.system.startingAgility).evaluate({async: false});
    const agility = abilityBonus(agiRoll.total);
    const preRoll = new Roll(clazz.system.startingPresence).evaluate({async: false});
    const presence = abilityBonus(preRoll.total);
    const touRoll = new Roll(clazz.system.startingToughness).evaluate({async: false});
    const toughness = abilityBonus(touRoll.total);

    const hitPoints = Math.max(1, hpRoll.total + toughness);
    const neuromancyPoints = Math.max(0, neuromancyPointsRoll.total + presence);

    const ccPack = game.packs.get(TABLES_PACK);
    const ccContent = await ccPack.getDocuments();
    const myTable = ccContent.find(i => i.name === "Misspent Youth");
    const bsTable = ccContent.find(i => i.name === "Battle Scars");
    const iiTable = ccContent.find(i => i.name === "Irritating Idiosyncrasies");
    const myResults = await compendiumTableDrawMany(myTable, 2);
    const bsDraw = await bsTable.draw({displayChat: false});
    const iiDraw = await iiTable.draw({displayChat: false});
    const misspentYouth1 = myResults[0].text;
    const misspentYouth2 = myResults[1].text;
    const battleScar = bsDraw.results[0].text;
    const idiosyncrasy = iiDraw.results[0].text;

    // start accumulating character description, starting with the class description
    const descriptionLines = [];
    descriptionLines.push(clazz.system.description);
    descriptionLines.push("<p>&nbsp;</p>");
    // BattleScars and Idiosyncrasis end with a period, but Misspent Youth entries don"t.
    descriptionLines.push(`${misspentYouth1} and ${misspentYouth2.charAt(0).toLowerCase()}${misspentYouth2.slice(1)}. ${battleScar} ${idiosyncrasy}`);
    descriptionLines.push("<p>&nbsp;</p>");

    // class-specific starting rolls
    const startingRollItems = [];
    if (clazz.system.startingRolls) {
        const lines = clazz.system.startingRolls.split("\n");
        for (const line of lines) {
            const [packName, tableName, rolls] = line.split(",");
            // assume 1 roll unless otherwise specified in the csv
            const numRolls = rolls ? parseInt(rolls) : 1;
            const pack = game.packs.get(packName);
            if (pack) {
                const content = await pack.getDocuments();
                const table = content.find(i => i.name === tableName);
                if (table) {
                    // const tableDraw = await table.drawMany(numRolls, {displayChat: false});
                    // const results = tableDraw.results;
                    const results = await compendiumTableDrawMany(table, numRolls);
                    for (const result of results) {
                        // draw result type: text (0), document (1), or compendium (2)
                        if (result.type === 0 && result.text) {
                            // non-blank text
                            if (result.text === "Random Hacked Tribute") {
                                const tribute = await randomHackedTribute();
                                startingRollItems.push(tribute);
                            } else if (result.text === "Random Encrypted Tribute") {
                                const tribute = await randomEncryptedTribute();
                                startingRollItems.push(tribute);
                            } else {
                                descriptionLines.push(`<p>${table.name}: ${result.text}</p>`);
                            }
                        } else if (result.type === 1) {
                            // document
                            // TODO: what do we want to do here?
                        } else if (result.type === 2) {
                            // compendium
                            const doc = await docFromResult(result);
                            startingRollItems.push(doc);
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
    
    // class-specific starting items
    const startingItems = [];
    if (clazz.system.startingItems) {
        const lines = clazz.system.startingItems.split("\n");
        for (const line of lines) {
            const [packName, itemName] = line.split(",");
            const pack = game.packs.get(packName);
            if (pack) {
                const content = await pack.getDocuments();
                const item = content.find(i => i.name === itemName);
                if (item) {
                    startingItems.push(item);
                }    
            }
        }
    }

    // TODO: pay attention to tributes in startingItems, too?
    const rolledTribute = startingRollItems.filter(i => i.type === "tribute").length > 0;

    // starting weapon
    let weapons = [];
    if (clazz.system.weaponTableDie) {
        let weaponDie = clazz.system.weaponTableDie;
        if (rolledTribute) {
            if (weaponDie === "1d10" || weaponDie === "1d8") {
                weaponDie = "1d6";
            }
        }        
        const weaponRoll = new Roll(weaponDie);
        const weaponTable = ccContent.find(i => i.name === "Weapons Table");
        const weaponDraw = await weaponTable.draw({roll: weaponRoll, displayChat: false});
        weapons = await docsFromResults(weaponDraw.results);
    }

    // starting armor
    let armors = [];
    if (clazz.system.armorTableDie) {
        const armorRoll = new Roll(clazz.system.armorTableDie);
        const armorTable = ccContent.find(i => i.name === "Armor Table");
        const armorDraw = await armorTable.draw({roll: armorRoll, displayChat: false});
        armors = await docsFromResults(armorDraw.results);
    }

    // all new documents
    const allDocs = [].concat([clazz], weapons, armors, startingItems, startingRollItems);

    // add items as owned items
    const items = allDocs.filter(e => e instanceof VGItem);

    // for other non-item documents, just add some description text
    const nonItems = allDocs.filter(e => !(e instanceof VGItem));
    for (const nonItem of nonItems) {
        if (nonItem && nonItem.type) {
            const upperType = nonItem.type.toUpperCase();
            descriptionLines.push(`<p>&nbsp;</p><p>${upperType}: ${nonItem.name}</p>`);
        } else {
            console.log(`Skipping non-item ${nonItem}`);
        }
    }

    return {
        actorImg: clazz.img,
        agility,
        credits,
        description: descriptionLines.join(""),
        favors: favorsRoll.total,
        hitPoints,
        items: items.map(i => simpleData(i)),
        neuromancyPoints,
        presence,
        strength,
        tokenImg: clazz.img,
        toughness,
    };
}

const simpleData = (item) => {
  return {
    img: item.img,
    name: item.name,
    system: item.system,
    type: item.type,
  };
};

const scvmToActorData = (s) => {
    return {
        type: "character",
        data: {
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
        items: s.items,
        flags: {}
    };
};

const createActorWithScvm = async (s) => {
    const data = scvmToActorData(s);
    // set some additional fields for new characters
    data.name = randomName() + " " + randomName();
    data.img = s.actorImg;
    // use VGActor.create() so we get default disposition, actor link, vision, etc
    const actor = await VGActor.create(data);
    actor.sheet.render(true);
};

const updateActorWithScvm = async (actor, s) => {
    const data = scvmToActorData(s);
    data.name = randomName() + " " + randomName();
    // Explicitly nuke all items before updating.
    // Before Foundry 0.8.x, actor.update() used to overwrite items,
    // but now doesn't. Maybe because we're passing items: [item.data]?
    // Dunno.
    await actor.deleteEmbeddedDocuments("Item", [], {deleteAll: true});
    await actor.update(data);
};

const docsFromResults = async (results) => {
    const docs = [];
    for (const result of results) {
        const doc = await docFromResult(result);
        if (doc) {            
            docs.push(doc);
        }
    }
    return docs;
}

const randomHackedTribute = async () => {
    const collection = game.packs.get(TABLES_PACK);
    const content = await collection.getDocuments();
    const table = content.find(i => i.name === "Hacked Tributes");
    const draw = await table.draw({displayChat: false});
    const items = await docsFromResults(draw.results);
    return items[0];
};

const randomEncryptedTribute = async () => {
    const collection = game.packs.get(TABLES_PACK);
    const content = await collection.getDocuments();
    const table = content.find(i => i.name === "Encrypted Tributes");
    const draw = await table.draw({displayChat: false});
    const items = await docsFromResults(draw.results);
    return items[0];
};

const docFromResult = async (result) => {
    // draw result type: text (0), document (1), or compendium (2)
    // TODO: figure out how we want to handle a document result

    if (result.type === 0) {
        // hack for not having recursive roll tables set up
        // TODO: set up recursive roll tables :P
        if (result.text === "Random Hacked Tribute") {
            return randomHackedTribute();
        } else if (result.text === "Random Encrypted Tribute") {
            return randomEncryptedTribute();
        }
    } else if (result.type === 2) {
        // grab the item from the compendium
        const collection = game.packs.get(result.documentCollection);

        if (collection) {
            // TODO: should we use pack.getDocument(entryId) ?
            // const item = await collection.getDocument(result._id);
            const content = await collection.getDocuments();
            const doc = content.find(i => i.name === result.text);
            return doc;
        } else {
            console.log("Could not find collection for result:");
            console.log(result);
        }
    }
};

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
        const tableDraw = await rollTable.draw({displayChat: false});
        if (rollTotals.includes(tableDraw.roll.total)) {
            // already rolled this, so roll again
            continue;
        }
        rollTotals.push(tableDraw.roll.total);
        results = results.concat(tableDraw.results);
    }
    return results;
};