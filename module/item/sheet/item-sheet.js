import { VG } from "../../config.js";
import * as editor from "../../editor.js";

/*
 * @extends {ItemSheet}
 */
export class VGItemSheet extends ItemSheet {
  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["vastgrimm", "sheet", "item"],
      width: 730,
      height: 680,
      tabs: [
        {
          navSelector: ".sheet-tabs",
          contentSelector: ".sheet-body",
          initial: "data",
        },
      ],
      dragDrop: [{ dragSelector: ".item-list .item", dropSelector: null }],
    });
  }

  /** @override */
  get template() {
    const path = "systems/vastgrimm/templates/item";
    if (Object.keys(VG.itemTypeKeys).includes(this.item.type)) {
      // specific item-type sheet
      return `${path}/${this.item.type}-sheet.html`;
    } else {
      // generic item sheet
      return `${path}/item-sheet.html`;
    }
  }

  /** @override */
  async getData(options) {
    const superData = super.getData(options);
    // TODO: should config live elsewhere?
    superData.config = CONFIG.VG;
    if (superData.data.system.tributeType) {
      superData.data.system.localizedtributeType = game.i18n.localize(
        VG.tributeTypes[superData.data.system.tributeType]
      );
    }
    return superData;
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
  }

    /** @override */
    activateEditor(name, options={}, initialContent="") {
      editor.setCustomEditorOptions(options);
      super.activateEditor(name, options, initialContent);
    }

}
