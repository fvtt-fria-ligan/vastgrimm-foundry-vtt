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

  // game.deathinspace = {
  //   config: VG.
  //   VGActor,
  //   VGItem,
  // };

  CONFIG.Actor.documentClass = VGActor;
  CONFIG.Item.documentClass = VGItem;
  CONFIG.VG = VG;
  // Actors.unregisterSheet("core", ActorSheet);
  // Actors.registerSheet(VG_DOC_CLASS, VGCharacterSheet, {
  //   types: ["character"],
  //   makeDefault: true,
  //   label: "VG.SheetClassCharacter"
  // });
  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet(VG_DOC_CLASS, VGItemSheet, { makeDefault: true });  
});