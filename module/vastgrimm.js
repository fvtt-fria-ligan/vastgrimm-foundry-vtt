/**
 * Vast Grimm system.
 */

import { VGActor } from "./actor/actor.js";
import { VGCharacterSheet } from "./actor/sheet/character-sheet.js";
import { VG } from "./config.js";
import { VGItem } from "./item/item.js";
import { VGItemSheet } from "./item/sheet/item-sheet.js";

const VG_DOC_CLASS = "vastgrimm";

Hooks.once("init", async function() {
  console.log("Initializing Vast Grimm system");
  
  // Register System Settings
  //registerSystemSettings();

  game.vastgrimm = {
    config: VG,
    // createVastGrimmMacro,
    VGActor,
    VGItem,
    //rollItemMacro,
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
  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet(VG_DOC_CLASS, VGItemSheet, { makeDefault: true });  
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
 * Formats a Roll as either the total or x + y + z = total if the roll has multiple results.
 */
Handlebars.registerHelper('xtotal', (roll) => {
  const resultPrefix = roll.result.length > 1 ? roll.result + " = " : "";
  return `${resultPrefix}${roll.total}`;
});
