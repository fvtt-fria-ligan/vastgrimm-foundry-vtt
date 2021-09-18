/**
 * Vast Grimm system.
 */

import { VGActor } from "./actor/actor.js";
import { VGCharacterSheet } from "./actor/sheet/character-sheet.js";
import { VG } from "./config.js";
import { VGItem } from "./item/item.js";
import { VGItemSheet } from "./item/sheet/item-sheet.js";

Hooks.once("init", async function() {
  console.log("Initializing Vast Grimm system");
});