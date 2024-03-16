import VGActorSheet from "./actor-sheet.js";

const byName = (a, b) => (a.name > b.name ? 1 : b.name > a.name ? -1 : 0);

/**
 * @extends {ActorSheet}
 */
export class VGFollowerSheet extends VGActorSheet {

  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["vastgrimm", "sheet", "actor", "follower"],
      template: "systems/vastgrimm/templates/actor/follower-sheet.html",
      width: 720,
      height: 690,
      tabs: [{navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description"}],
      // is dragDrop needed?
      // dragDrop: [{dragSelector: ".item-list .item", dropSelector: null}]
    });
  }

  /** @override */
  getData() {
    const superData = super.getData();
    const data = superData.data;
    data.config = CONFIG.VG;
    if (this.actor.type == 'follower') {
      this._prepareFollowerItems(data);
    }
    return superData;
  }

  /**
   * Organize and classify Items for Follower sheets.
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
  _prepareFollowerItems(sheetData) {
    let equipment = [];
    let equippedArmor = null;
    let equippedHelmet = null;
    let equippedWeapons = [];
    let containers = [];

    for (const i of sheetData.items) {
      let item = i.system;
      i.img = i.img || DEFAULT_TOKEN;

      item.equippable = (i.type === 'armor' || i.type === 'helmet' || i.type === 'weapon');
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
      } else if (i.type === CONFIG.VG.itemTypes.helmet) {
        if (item.equipped) {
          // only one helmet may be equipped at a time
          equippedHelmet = i;
        }
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
    sheetData.system.equippedHelmet = equippedHelmet;
    sheetData.system.equippedWeapons = equippedWeapons;

    sheetData.system.ammo = sheetData.items
      .filter((item) => item.type === CONFIG.VG.itemTypes.ammo)
      .sort(byName);    
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;

    // Handle rollable items.
    html.find(".morale").on("click", this._onMoraleRoll.bind(this));
  }

  /**
   * Handle morale roll.
   */
  _onMoraleRoll(event) {
    event.preventDefault();   
    this.actor.checkMorale();
  }  
}
