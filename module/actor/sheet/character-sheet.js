import VGActorSheet from "./actor-sheet.js";
import RestDialog from "./rest-dialog.js";

/**
 * @extends {ActorSheet}
 */
export class VGCharacterSheet extends VGActorSheet {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["vastgrimm", "sheet", "actor", "character"],
      template: "systems/vastgrimm/templates/actor/character-sheet.html",
      width: 820,
      height: 690,
      tabs: [
        {
          navSelector: ".sheet-tabs",
          contentSelector: ".sheet-body",
          initial: "combat",
        },
      ],
      dragDrop: [{ dragSelector: ".item-list .item", dropSelector: null }],
    });
  }

  /** @override */
  async getData() {
    const superData = await super.getData();
    const data = superData.data;
    data.config = CONFIG.MB;

    // Ability Scores
    for (const [a, abl] of Object.entries(data.system.abilities)) {
      const translationKey = CONFIG.VG.abilities[a];
      abl.label = game.i18n.localize(translationKey);
    }

    // Prepare items.
    // TODO: should preparing items move into the MBActor class?
    if (this.actor.type == "character") {
      this._prepareCharacterItems(data);
    }

    return superData;
  }

  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} sheetData The sheet data to prepare.
   * @return {undefined}
   */
  _prepareCharacterItems(sheetData) {
    const byName = (a, b) => (a.name > b.name ? 1 : b.name > a.name ? -1 : 0);
    sheetData.system.skills = sheetData.items
      .filter((item) => item.type === CONFIG.VG.itemTypes.skill)
      .sort(byName);
    sheetData.system.class = sheetData.items.filter(
      (item) => item.type === CONFIG.VG.itemTypes.class
    )[0];

    // TODO: make better use of filters below
    let equipment = [];
    let equippedArmor = null;
    let equippedHelmet = null;
    let equippedWeapons = [];
    // TODO: should we just create a hash of itemType => items?
    let tributes = [];
    let containers = [];

    for (const i of sheetData.items) {
      i.img = i.img || DEFAULT_TOKEN;

      let item = i.system;
      item.equippable =
        i.type === CONFIG.VG.itemTypes.armor ||
        i.type === CONFIG.VG.itemTypes.helmet ||
        i.type === CONFIG.VG.itemTypes.weapon;
      if (item.equippable) {
        const isEquipped = foundry.utils.getProperty(item, "equipped");
        item.toggleClass = isEquipped ? "equipped" : "";
        item.toggleTitle = game.i18n.localize(
          isEquipped ? "VG.ItemEquipped" : "VG.ItemUnequipped"
        );
      }

      if (CONFIG.VG.itemEquipmentTypes.includes(i.type)) {
        equipment.push(i);
      }
      if (i.type === CONFIG.VG.itemTypes.armor) {
        item.damageReductionDie =
          CONFIG.VG.armorTiers[item.tier.value].damageReductionDie;
        if (item.equipped) {
          // only one armor may be equipped at a time
          equippedArmor = i;
        }
      } else if (i.type === CONFIG.VG.itemTypes.container) {
        containers.push(i);
      } else if (i.type === CONFIG.VG.itemTypes.tribute) {
        tributes.push(i);
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
    // sort alphabetically
    equipment.sort((a, b) => (a.name > b.name ? 1 : b.name > a.name ? -1 : 0));
    equippedWeapons.sort((a, b) =>
      a.name > b.name ? 1 : b.name > a.name ? -1 : 0
    );

    // Assign to new properties
    sheetData.system.equipment = equipment;
    sheetData.system.equippedArmor = equippedArmor;
    sheetData.system.equippedHelmet = equippedHelmet;
    sheetData.system.equippedWeapons = equippedWeapons;
    sheetData.system.tributes = tributes;

    sheetData.system.containerSpace = this.actor.containerSpace();
    sheetData.system.containerCapacity = this.actor.containerCapacity();
    // TODO: rename to carryingWeight?
    sheetData.system.carryingCount = this.actor.carryingWeight();
    sheetData.system.carryingCapacity = this.actor.normalCarryingCapacity();
    const isEncumbered = this.actor.isEncumbered();
    sheetData.system.encumbered = isEncumbered;
    sheetData.system.encumberedClass = isEncumbered ? "encumbered" : "";

    sheetData.system.ammo = sheetData.items
      .filter((item) => item.type === CONFIG.VG.itemTypes.ammo)
      .sort(byName);    
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;

    // sheet header
    html
      .find(".ability-label.rollable.strength")
      .on("click", this._onStrengthRoll.bind(this));
    html
      .find(".ability-label.rollable.agility")
      .on("click", this._onAgilityRoll.bind(this));
    html
      .find(".ability-label.rollable.presence")
      .on("click", this._onPresenceRoll.bind(this));
    html
      .find(".ability-label.rollable.toughness")
      .on("click", this._onToughnessRoll.bind(this));
    html.find(".item-scvmify").click(this._onObliterate.bind(this));
    html.find(".broken-button").on("click", this._onBroken.bind(this));
    html.find(".rest-button").on("click", this._onRest.bind(this));
    html
      .find(".favors-row span.rollable")
      .on("click", this._onOmensRoll.bind(this));
    html.find(".improve-button").on("click", this._onImprove.bind(this));
    // skills tab
    html.find(".skill-button").on("click", this._onSkillRoll.bind(this));
    // neuromancy tab
    html
      .find(".activate-tribute-button")
      .on("click", this._onActivateTributeRoll.bind(this));
    html
      .find(".neuromancy-per-day-text")
      .on("click", this._onNeuromancyPointsPerDayRoll.bind(this));
    html.find("select.ammo-select").on("change", this._onAmmoSelect.bind(this));      
  }

  _onStrengthRoll(event) {
    event.preventDefault();
    this.actor.testStrength();
  }

  _onAgilityRoll(event) {
    event.preventDefault();
    this.actor.testAgility();
  }

  _onPresenceRoll(event) {
    event.preventDefault();
    this.actor.testPresence();
  }

  _onToughnessRoll(event) {
    event.preventDefault();
    this.actor.testToughness();
  }

  _onOmensRoll(event) {
    event.preventDefault();
    this.actor.rollOmens();
  }

  _onNeuromancyPointsPerDayRoll(event) {
    event.preventDefault();
    this.actor.rollNeuromancyPointsPerDay();
  }

  _onObliterate(event) {
    event.preventDefault();
    this.actor.scvmify();
  }

  _onBroken(event) {
    event.preventDefault();
    this.actor.rollBroken();
  }

  _onRest(event) {
    event.preventDefault();
    const restDialog = new RestDialog();
    // TODO: maybe move this into a constructor,
    // if we can resolve the foundry.utils.mergeObject() Maximum call stack size exceeded error
    restDialog.actor = this.actor;
    restDialog.render(true);
  }

  _onImprove(event) {
    event.preventDefault();
    // confirm before doing Improvement
    let d = new Dialog({
      title: game.i18n.localize("VG.Improve"),
      content:
        `<p>&nbsp;<p>${game.i18n.localize("VG.ImproveText")}<p>&nbsp;`,
      buttons: {
        cancel: {
          label: game.i18n.localize("VG.Cancel"),
        },
        getbetter: {
          icon: '<i class="fas fa-check"></i>',
          label: game.i18n.localize("VG.Improve"),
          callback: () => this.actor.improve(),
        },
      },
      default: "cancel",
    });
    d.render(true);
  }

  _onSkillRoll(event) {
    event.preventDefault();
    const button = $(event.currentTarget);
    const li = button.parents(".item");
    const itemId = li.data("itemId");
    this.actor.useSkill(itemId);
  }

  _onActivateTributeRoll(event) {
    event.preventDefault();
    this.actor.activateTribute();
  }
}
