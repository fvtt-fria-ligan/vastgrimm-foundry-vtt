import VGActorSheet from "./actor-sheet.js";

/**
 * @extends {ActorSheet}
 */
 export class VGContainerSheet extends VGActorSheet {

  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["vastgrimm", "sheet", "actor", "container"],
      template: "systems/vastgrimm/templates/actor/container-sheet.html",
      width: 720,
      height: 680,
      tabs: [{navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "contents"}],
      // is dragDrop needed?
      // dragDrop: [{dragSelector: ".item-list .item", dropSelector: null}]
    });
  }

  /** @override */
  getData() {
    const superData = super.getData();
    const data = superData.data;
    data.config = CONFIG.VG;
    if (this.actor.type == 'container') {
      this._prepareContainerItems(data);
    }
    return superData;
  }

  /**
   * Organize and classify Items for Container sheets.
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
  _prepareContainerItems(sheetData) {
    let equipment = [];
    for (const i of sheetData.items) {
      i.img = i.img || DEFAULT_TOKEN;
      if (CONFIG.VG.itemEquipmentTypes.includes(i.type)) {
        equipment.push(i);
      }
    }
    equipment.sort((a, b) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0));
    sheetData.system.equipment = equipment;
    sheetData.system.containerSpace = this._containerSpace(sheetData);
  }

  _containerSpace(sheetData) {
    let total = 0;
    for (const item of sheetData.items) {
      if (CONFIG.VG.itemEquipmentTypes.includes(item.type) &&         
          item.data.volume) {  
          const roundedSpace = Math.ceil(item.data.volume * item.data.quantity);
          total += roundedSpace;
      }
    }
    return total;
  }
}