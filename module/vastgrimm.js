/**
 * Vast Grimm system.
 */

import { VGActor } from "./actor/actor.js";
import { VGCharacterSheet } from "./actor/sheet/character-sheet.js";
import { VGContainerSheet } from "./actor/sheet/container-sheet.js";
import { VGCreatureSheet } from "./actor/sheet/creature-sheet.js";
import { VGFollowerSheet } from "./actor/sheet/follower-sheet.js";
import { VGShipSheet } from "./actor/sheet/ship-sheet.js";
import { VG } from "./config.js";
import { VGItem } from "./item/item.js";
import { VGItemSheet } from "./item/sheet/item-sheet.js";
import { createVastGrimmMacro, rollItemMacro } from "./macros.js";
import ScvmDialog from "./scvm/scvm-dialog.js";
import { registerSystemSettings } from "./settings.js";

const VG_DOC_CLASS = "vastgrimm";

Hooks.once("init", async function() {
  console.log("Initializing Vast Grimm system");
  
  registerSystemSettings();

  game.vastgrimm = {
    config: VG,
    createVastGrimmMacro,
    VGActor,
    VGItem,
    rollItemMacro,
  };

  CONFIG.Actor.documentClass = VGActor;
  CONFIG.Item.documentClass = VGItem;
  CONFIG.Combat.initiative = {
    formula: "1d6 + @abilities.agility.value",
  };
  CONFIG.VG = VG;
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet(VG_DOC_CLASS, VGCharacterSheet, {
    types: ["character"],
    makeDefault: true,
    label: "VG.SheetClassCharacter"
  });
  Actors.registerSheet(VG_DOC_CLASS, VGContainerSheet, {
    types: ["container"],
    makeDefault: true,
    label: "VG.SheetClassContainer"
  });
  Actors.registerSheet(VG_DOC_CLASS, VGCreatureSheet, {
    types: ["creature"],
    makeDefault: true,
    label: "VG.SheetClassCreature"
  });    
  Actors.registerSheet(VG_DOC_CLASS, VGFollowerSheet, {
    types: ["follower"],
    makeDefault: true,
    label: "VG.SheetClassFollower"
  });
  Actors.registerSheet(VG_DOC_CLASS, VGShipSheet, {
    types: ["ship"],
    makeDefault: true,
    label: "VG.SheetClassShip"
  });  
  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet(VG_DOC_CLASS, VGItemSheet, { makeDefault: true });  
});

/**
 * Once the entire VTT framework is initialized, check to see if we should perform a data migration
 */
 Hooks.once("ready", () => {
  applyFontsAndColors();
  // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
  Hooks.on("hotbarDrop", (bar, data, slot) => createVastGrimmMacro(data, slot));  
});

const applyFontsAndColors = () => {
  const fontSchemeSetting = game.settings.get("vastgrimm", "fontScheme");
  const fontScheme = CONFIG.VG.fontSchemes[fontSchemeSetting];
  const colorSchemeSetting = game.settings.get("vastgrimm", "colorScheme");
  const colorScheme = CONFIG.VG.colorSchemes[colorSchemeSetting];
  const r = document.querySelector(":root");
  r.style.setProperty("--window-background", colorScheme.windowBackground);
  r.style.setProperty("--background-color", colorScheme.background);
  r.style.setProperty("--foreground-color", colorScheme.foreground);
  r.style.setProperty("--foreground-alt-color", colorScheme.foregroundAlt);
  r.style.setProperty("--highlight-background-color", colorScheme.highlightBackground);
  r.style.setProperty("--highlight-foreground-color", colorScheme.highlightForeground);
  r.style.setProperty("--sidebar-background-color", colorScheme.sidebarBackground);
  r.style.setProperty("--sidebar-foreground-color", colorScheme.sidebarForeground);
  r.style.setProperty("--sidebar-button-background-color", colorScheme.sidebarButtonBackground);
  r.style.setProperty("--sidebar-button-foreground-color", colorScheme.sidebarButtonForeground);
  r.style.setProperty("--chat-font", fontScheme.chat);
  r.style.setProperty("--chat-info-font", fontScheme.chatInfo);
  r.style.setProperty("--h1-font", fontScheme.h1);
  r.style.setProperty("--h2-font", fontScheme.h2);
  r.style.setProperty("--h3-font", fontScheme.h3);
  r.style.setProperty("--item-font", fontScheme.item);
};

const classWasDropped = async (dropped) => {
  if (dropped.type !== "Item") {
    return false;
  }
  if (dropped.pack) {
    const collection = game.packs.get(dropped.pack);
    const content = await collection.getDocuments();
    const item = content.find(i => i.id === dropped.id);
    return item && item.data && item.data.type === "class";
  }
  // not from pack, see if it's in world/game items
  const item = game.items.find(i => i.id === dropped.id);
  if (item && item.data) {
    return item.data.type === "class";
  }
  return false;
};

Hooks.on('dropActorSheetData', async (actor, actorSheet, dropped) => {
  // Handle only allowing one Class item at a time
  const isAClass = await classWasDropped(dropped);
  if (isAClass) {
    // Dropping a new class, so nuke any pre-existing class item(s),
    // to enforce that a character only has one class item at a time.
    const classes = actor.items.filter(i => i.data.type === "class");
    const deletions = classes.map(i => i.id);
    await actor.deleteEmbeddedDocuments("Item", deletions);
  }

  // Handle container actor destructive drag-drop
  if (dropped.type === "Item" && dropped.data && dropped.data._id) {
    const sourceActor = dropped.tokenId ? game.actors.tokens[dropped.tokenId] : game.actors.get(dropped.actorId);
    if (sourceActor && actor.id !== sourceActor.id && 
      (sourceActor.data.type === "container" || actor.data.type === "container")) {
      // either the source or target actor is a container,
      // so delete the item from the source
      await sourceActor.deleteEmbeddedDocuments("Item", [dropped.data._id]);
    }
  }
});

Hooks.on('createActor', async (actor, options, userId) => {
  // give Characters a default class
  if (actor.data.type === "character" && game.packs) {
    const hasAClass = actor.items.filter(i => i.data.type === "class").length > 0;
    if (!hasAClass) {
      const pack = game.packs.get("vastgrimm.class-treacherous-merc");
      if (!pack) {
        console.error("Could not find compendium vastgrimm.class-treacherous-merc");
        return;
      }
      const index = await pack.getIndex();
      const entry = index.find(e => e.name === "Treacherous Merc");
      if (!entry) {
        console.error("Could not find Treacherous Merc class in compendium.");
        return;
      }
      const doc = await pack.getDocument(entry._id);
      if (!doc) {
        console.error("Could not get document for Treacherous class.");
        return;
      }
      await actor.createEmbeddedDocuments("Item", [duplicate(doc.data)]);
    }
  }
});

Hooks.on('renderActorDirectory', (app,  html, data) => {
  if (game.user.can("ACTOR_CREATE")) {
    // only show the Generate Character button to users who can create actors
    const section = document.createElement('header');
    section.classList.add('scvmfactory');
    section.classList.add('directory-header');
    // Add menu before directory header
    const dirHeader = html[0].querySelector('.directory-header');
    dirHeader.parentNode.insertBefore(section, dirHeader);
    section.insertAdjacentHTML('afterbegin',`
      <div class="header-actions action-buttons flexrow">
        <button class="create-scvm-button"><i class="fas fa-skull"></i>${game.i18n.localize("VG.GenerateCharacter")}</button>
      </div>
      `);
    section.querySelector('.create-scvm-button').addEventListener('click', (ev) => {
      new ScvmDialog().render(true);
    });  
  }
});

Hooks.on('renderCombatTracker', (tracker, html) => {
  const partyInitiativeButton = `<a class="combat-control" title="${game.i18n.localize('MB.RollPartyInitiative')}" dataControl="rollParty"><i class="fas fa-dice-six"></i></a>`;
  html.find("header").find("nav").last().prepend(partyInitiativeButton);
  html.find("a[dataControl=rollParty]").click(ev => { rollPartyInitiative() });
});

// Handlebars helpers
// TODO: registering a helper named "eq" breaks filepicker
Handlebars.registerHelper('ifEq', function(arg1, arg2, options) {
  // TODO: verify whether we want == or === for this equality check
  return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
});
Handlebars.registerHelper('ifGe', function(arg1, arg2, options) {
  return (arg1 >= arg2) ? options.fn(this) : options.inverse(this);
});
Handlebars.registerHelper('ifGt', function(arg1, arg2, options) {
  return (arg1 > arg2) ? options.fn(this) : options.inverse(this);
});
Handlebars.registerHelper('ifLe', function(arg1, arg2, options) {
  return (arg1 <= arg2) ? options.fn(this) : options.inverse(this);
});
Handlebars.registerHelper('ifLt', function(arg1, arg2, options) {
  return (arg1 < arg2) ? options.fn(this) : options.inverse(this);
});
Handlebars.registerHelper('ifNe', function(arg1, arg2, options) {
  // TODO: verify whether we want == or === for this equality check
  return (arg1 != arg2) ? options.fn(this) : options.inverse(this);
});
/**
 * Formats a Roll as either the total or x + y + z = total if the roll has multiple terms.
 */
Handlebars.registerHelper('xtotal', (roll) => {
  // collapse addition of negatives into just subtractions
  // e.g., 15 +  - 1 => 15 - 1
  // Also: apparently roll.result uses 2 spaces as separators?
  // We replace both 2- and 1-space varieties
  const result = roll.result.replace("+  -", "-").replace("+ -", "-");

  // roll.result is a string of terms. E.g., "16" or "1 + 15".
  if (result !== roll.total.toString()) {
    return `${result} = ${roll.total}`;
  } else {
    return result;
  }
});
