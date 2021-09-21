import VGActorSheet from "./actor-sheet.js";
import RestDialog from "./rest-dialog.js";

/**
 * @extends {ActorSheet}
 */
export class VGCharacterSheet extends VGActorSheet {
  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["vastgrimm", "sheet", "actor", "character"],
      template: "systems/vastgrimm/templates/actor/character-sheet.html",
      width: 800,
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
  getData() {
    const superData = super.getData();
    const data = superData.data;
    data.config = CONFIG.MB;

    // Ability Scores
    for (let [a, abl] of Object.entries(data.data.abilities)) {
      const translationKey = CONFIG.VG.abilities[a];
      abl.label = game.i18n.localize(translationKey);
    }

    // Prepare items.
    // TODO: should preparing items move into the MBActor class?
    if (this.actor.data.type == "character") {
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
    sheetData.data.skills = sheetData.items
      .filter((item) => item.type === CONFIG.VG.itemTypes.skill)
      .sort(byName);
    sheetData.data.class = sheetData.items.filter(
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

    for (let i of sheetData.items) {
      let item = i.data;
      i.img = i.img || DEFAULT_TOKEN;

      item.equippable =
        i.type === CONFIG.VG.itemTypes.armor ||
        i.type === CONFIG.VG.itemTypes.helmet ||
        i.type === CONFIG.VG.itemTypes.weapon;
      if (item.equippable) {
        const isEquipped = getProperty(item, "equipped");
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
    sheetData.data.equipment = equipment;
    sheetData.data.equippedArmor = equippedArmor;
    sheetData.data.equippedHelmet = equippedHelmet;
    sheetData.data.equippedWeapons = equippedWeapons;
    sheetData.data.tributes = tributes;

    sheetData.data.containerSpace = this.actor.containerSpace();
    sheetData.data.containerCapacity = this.actor.containerCapacity();
    // TODO: rename to carryingWeight?
    sheetData.data.carryingCount = this.actor.carryingWeight();
    sheetData.data.carryingCapacity = this.actor.normalCarryingCapacity();
    const isEncumbered = this.actor.isEncumbered();
    sheetData.data.encumbered = isEncumbered;
    sheetData.data.encumberedClass = isEncumbered ? "encumbered" : "";
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
    html.find(".improve-button").on("click", this._onGetBetter.bind(this));
    // skills tab
    html.find(".skill-button").on("click", this._onSkillRoll.bind(this));
    // neuromancy tab
    html
      .find(".activate-tribute-button")
      .on("click", this._onActivatePowerRoll.bind(this));
    html
      .find(".neuromancy-per-day-text")
      .on("click", this._onNeuromancyPointsPerDayRoll.bind(this));
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
    // if we can resolve the mergeObject() Maximum call stack size exceeded error
    restDialog.actor = this.actor;
    restDialog.render(true);
  }

  _onGetBetter(event) {
    event.preventDefault();
    // confirm before doing get better
    let d = new Dialog({
      title: game.i18n.localize("VG.Improve"),
      content:
        "<p>&nbsp;<p>The game master decides when a character should be improved.<p>It can be after completing a scenario, killing mighty foes, or bringing home treasure.<p>&nbsp;",
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

  _onActivatePowerRoll(event) {
    event.preventDefault();
    this.actor.wieldPower();
  }
}
