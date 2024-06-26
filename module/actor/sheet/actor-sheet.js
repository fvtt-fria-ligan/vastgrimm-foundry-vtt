import * as editor from "../../editor.js";
import { rollIndividualInitiative, rollLegionInitiative } from "../../combat.js";

/**
 * @extends {ActorSheet}
 */
export default class VGActorSheet extends ActorSheet {
  /** @override */
  activateEditor(name, options={}, initialContent="") {
    editor.setCustomEditorOptions(options);
    super.activateEditor(name, options, initialContent);
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;

    // Add Inventory Item
    html.find('.item-create').click(this._onItemCreate.bind(this));

    // Update Inventory Item
    html.find('.item-edit').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      item.sheet.render(true);
    });

    // Delete Inventory Item
    html.find('.item-delete').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      this.actor.deleteEmbeddedDocuments("Item", [li.data("itemId")]);
      li.slideUp(200, () => this.render(false));
    });

    // Additional item/inventory buttons
    html.find('.item-qty-plus').click(this._onItemAddQuantity.bind(this));
    html.find('.item-qty-minus').click(this._onItemSubtractQuantity.bind(this));
    html.find('.item-toggle').click(this._onToggleItem.bind(this));

    // Combat-related buttons
    html.find(".legion-initiative-button").on("click", this._onLegionInitiativeRoll.bind(this));
    html.find(".individual-initiative-button").on("click", this._onIndividualInitiativeRoll.bind(this));
    html.find(".attack-button").on("click", this._onAttackRoll.bind(this));
    html.find(".defend-button").on("click", this._onDefendRoll.bind(this));
    html.find('.tier-radio').click(this._onArmorTierRadio.bind(this));    
  }

  /**
   * Handle creating a new Owned Item for the actor.
   *
   * @param {Event} event   The originating click event
   * @private
   */
  async _onItemCreate(event) {
    event.preventDefault();
    const template = "systems/vastgrimm/templates/dialog/add-item-dialog.html";
    let dialogData = {
      config: CONFIG.MorkBorg
    };
    const html = await renderTemplate(template, dialogData);
    return new Promise(resolve => {
      new Dialog({
         title: game.i18n.localize('VG.CreateNewItem'),
         content: html,
         buttons: {
            create: {
              icon: '<i class="fas fa-check"></i>',
              label: game.i18n.localize('VG.CreateNewItem'),
              callback: html => resolve(_createItem(this.actor, html[0].querySelector("form")))
            },
         },
         default: "create",
         close: () => resolve(null)
        }).render(true);
    });
  }

  /**
   * Handle adding quantity of an Owned Item within the Actor
   */
  async _onItemAddQuantity(event) {
    event.preventDefault();
    let anchor = $(event.currentTarget);
    const li = anchor.parents(".item");
    const itemId = li.data("itemId");
    const item = this.actor.items.get(itemId);
    const attr = "system.quantity";
    const currQuantity = getProperty(item.data, attr);
    return item.update({[attr]: currQuantity + 1});
  }

  /**
   * Handle subtracting quantity of an Owned Item within the Actor
   */
  async _onItemSubtractQuantity(event) {
    event.preventDefault();
    let anchor = $(event.currentTarget);
    const li = anchor.parents(".item");
    const itemId = li.data("itemId");
    const item = this.actor.items.get(itemId);
    const attr = "system.quantity";
    const currQuantity = foundry.utils.getProperty(item.data, attr);
    // can't reduce quantity below one
    if (currQuantity > 1) {
      return item.update({[attr]: currQuantity - 1});  
    }
  }

  /**
   * Handle toggling the state of an Owned Item within the Actor
   *
   * @param {Event} event   The triggering click event
   * @private
   */
  async _onToggleItem(event) {
    event.preventDefault();
    let anchor = $(event.currentTarget);
    const li = anchor.parents(".item");
    const itemId = li.data("itemId");
    const item = this.actor.items.get(itemId);
    const attr = "system.equipped";
    const currEquipped = foundry.utils.getProperty(item.system, attr);
    if (!currEquipped) {
      // we're equipping something
      // if this is armor or helmet, unequip any other equipped armor/helmet
      if (item.type === 'armor' || item.type === 'helmet') {
        for (const otherItem of this.actor.items) {
          if (otherItem.type === item.type && otherItem.id != item.id) {
            const otherEquipped = getProperty(otherItem.data, attr);
            if (otherEquipped) {
              await otherItem.update({[attr]: false});
            }
          }
        }
      }
    }
    return item.update({[attr]: !foundry.utils.getProperty(item.system, attr)});
  }

  /**
   * Listen for roll buttons on items.
   *
   * @param {MouseEvent} event    The originating left click event
   */
  _onItemRoll(event) {
    event.preventDefault();
    let button = $(event.currentTarget);
    let r = new Roll(button.data('roll'), this.actor.getRollData());
    const li = button.parents(".item");
    const item = this.actor.items.get(li.data("itemId"));
    r.roll().toMessage({
        user: game.user.id,
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: `<h2>${item.name}</h2><h3>${button.text()}</h3>`
    });
  }

  /**
   * Handle a click on the Legion Initiative button.
   */
   async _onLegionInitiativeRoll(event) {
    event.preventDefault();
    rollLegionInitiative();
  }

  /**
   * Handle a click on the Individual Initiative button.
   */
  async _onIndividualInitiativeRoll(event) {
    event.preventDefault();
    rollIndividualInitiative(this.actor);
  }

  /**
   * Handle a click on an item Attack button.
   */
  _onAttackRoll(event) {
    event.preventDefault();
    const button = $(event.currentTarget);
    const li = button.parents(".item");
    const itemId = li.data("itemId");
    this.actor.attack(itemId);
  }

  /**
   * Handle a click on the armor current tier radio buttons.
   */
   _onArmorTierRadio(event) {
    event.preventDefault();
    let input = $(event.currentTarget);
    let newTier = parseInt(input[0].value);
    let li = input.parents(".item");
    const item = this.actor.items.get(li.data("itemId"));
    return item.update({["system.tier.value"]: newTier});
  }

  /**
   * Handle a click on the Defend button.
   */
  async _onDefendRoll(event) {
    event.preventDefault();
    const sheetData = await this.getData();
    const armorItemId = sheetData.data.system.equippedArmor?.id;
    const helmetItemId = sheetData.data.system.equippedHelmet?.id;
    this.actor.defend(armorItemId, helmetItemId);
  }

  async _onAmmoSelect(event) {
    event.preventDefault();
    const select = $(event.currentTarget);
    const weapon = this.actor.items.get(select.data("itemId"));
    //const ammo = this.actor.items.get(select.val());
    if (weapon) {
      await weapon.update({ ["system.ammoId"]: select.val() });
    }
  }  
 }

/**
 * Create a new Owned Item for the given actor, based on the name/type from the form.
 */
const _createItem = async (actor, form) => {
    const itemData = {
      name: form.itemname.value,
      type: form.itemtype.value,
      data: {}
    };
    await actor.createEmbeddedDocuments("Item", [itemData]);
};
