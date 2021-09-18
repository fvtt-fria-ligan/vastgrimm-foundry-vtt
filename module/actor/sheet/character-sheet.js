import VGActorSheet from "./actor-sheet.js";

/**
 * @extends {ActorSheet}
 */
export class VGCharacterSheet extends VGActorSheet {

  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["vastgrimm", "sheet", "actor", "character"],
      template: "systems/vastgrimm/templates/actor/character-sheet.html",
      width: 730,
      height: 680,
      tabs: [{navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "personal"}],
      dragDrop: [{dragSelector: ".item-list .item", dropSelector: null}]
    });
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
  }
}
