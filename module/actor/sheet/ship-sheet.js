import VGActorSheet from "./actor-sheet.js";

/**
 * @extends {ActorSheet}
 */
export class VGShipSheet extends VGActorSheet {

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["vastgrimm", "sheet", "actor", "ship"],
      template: "systems/vastgrimm/templates/actor/ship-sheet.html",
      width: 720,
      height: 690,
      tabs: [{navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description"}],
      // is dragDrop needed?
      // dragDrop: [{dragSelector: ".item-list .item", dropSelector: null}]
    });
  }

  /** @override */
  async getData() {
    const superData = await super.getData();
    const data = superData.data;
    data.config = CONFIG.VG;
    this._prepareShipItems(data);
    return superData;
  }

  /**
   * Organize and classify Items for Follower sheets.
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
  _prepareShipItems(sheetData) {
    let equipment = [];
    let equippedArmor = null;
    let equippedWeapons = [];

    for (const i of sheetData.items) {
      let item = i.data;
      i.img = i.img || DEFAULT_TOKEN;

      item.equippable = (i.type === 'armor' || i.type === 'weapon');
      if (item.equippable) {
        const isEquipped = getProperty(item, "equipped");
        item.toggleClass = isEquipped ? "equipped" : "";
        item.toggleTitle = game.i18n.localize(isEquipped ? "VG.ItemEquipped" : "VG.ItemUnequipped");
      }

      if (CONFIG.VG.itemEquipmentTypes.includes(i.type)) {
        equipment.push(i);
      }      
      if (i.type === CONFIG.VG.itemTypes.armor) {
        item.damageReductionDie = CONFIG.VG.armorTiers[item.tier.value].damageReductionDie;
        if (item.equipped) {
          // only one armor may be equipped at a time
          equippedArmor = i;
        }
      } else if (i.type === CONFIG.VG.itemTypes.container) {
        containers.push(i);
      } else if (i.type === CONFIG.VG.itemTypes.weapon) {
        if (item.equipped) {
          equippedWeapons.push(i);
        }
      }
    }
    equipment.sort((a, b) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0));
    equippedWeapons.sort((a, b) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0));

    // Assign to new properties
    sheetData.system.equipment = equipment;
    sheetData.system.equippedArmor = equippedArmor;
    sheetData.system.equippedWeapons = equippedWeapons;
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;
  }

  /**
   * Handle morale roll.
   */
  _onMoraleRoll(event) {
    event.preventDefault();   
    this.actor.checkMorale();
  }  
}
