import { addShowDicePromise, diceSound, showDice } from "../dice.js";
import ScvmDialog from "../scvm/scvm-dialog.js";

const ACTIVATE_TRIBUTE_ROLL_CARD_TEMPLATE = "systems/vastgrimm/templates/chat/activate-tribute-roll-card.html";
const ATTACK_DIALOG_TEMPLATE = "systems/vastgrimm/templates/dialog/attack-dialog.html";
const ATTACK_ROLL_CARD_TEMPLATE = "systems/vastgrimm/templates/chat/attack-roll-card.html";
const BROKEN_ROLL_CARD_TEMPLATE = "systems/vastgrimm/templates/chat/broken-roll-card.html";
const DEFEND_DIALOG_TEMPLATE = "systems/vastgrimm/templates/dialog/defend-dialog.html";
const DEFEND_ROLL_CARD_TEMPLATE = "systems/vastgrimm/templates/chat/defend-roll-card.html";
const IMPROVE_ROLL_CARD_TEMPLATE = "systems/vastgrimm/templates/chat/improve-roll-card.html";
const MORALE_ROLL_CARD_TEMPLATE = "systems/vastgrimm/templates/chat/morale-roll-card.html";
const OUTCOME_ONLY_ROLL_CARD_TEMPLATE = "systems/vastgrimm/templates/chat/outcome-only-roll-card.html";
const OUTCOME_ROLL_CARD_TEMPLATE = "systems/vastgrimm/templates/chat/outcome-roll-card.html";
const REACTION_ROLL_CARD_TEMPLATE = "systems/vastgrimm/templates/chat/reaction-roll-card.html";
const TEST_ABILITY_ROLL_CARD_TEMPLATE = "systems/vastgrimm/templates/chat/test-ability-roll-card.html";

/**
 * @extends {Actor}
 */
export class VGActor extends Actor {
  /** @override */
  static async create(data, options={}) {
    data.token = data.token || {};
    let defaults = {};
    if (data.type === "character") {
      defaults = {
        actorLink: true,
        disposition: 1,
        vision: true,
      };
    } else if (data.type === "container") {
      defaults = {
        actorLink: false,
        disposition: 0,
        vision: false,
      };
    } else if (data.type === "creature") {
      defaults = {
        actorLink: false,
        disposition: -1,
        vision: false,
      };
    }
    mergeObject(data.token, defaults, {overwrite: false});
    return super.create(data, options);
  }

  /** @override */
  prepareData() {
    super.prepareData();
  }

  /** @override */
  getRollData() {
    const data = super.getRollData();
    return data;
  }

  _firstEquipped(itemType) {
    for (const item of this.data.items) {
      if (item.type === itemType && item.data.system.equipped) {
        return item;
      }
    }
    return undefined;
  }

  equippedArmor() {
    return this._firstEquipped("armor");
  }

  equippedHelmet() {
    return this._firstEquipped("helmet");
  }

  normalCarryingCapacity() {
    return this.system.abilities.strength.value + 8;
  }

  maxCarryingCapacity() {
    return 2 * this.normalCarryingCapacity();
  }

  carryingWeight() {
    let total = 0;
    for (const item of this.items) {
      if (CONFIG.VG.itemEquipmentTypes.includes(item.type) && item.data.system.weight) {
        const roundedWeight = Math.ceil(item.data.system.weight * item.data.system.quantity);
        total += roundedWeight;
      }
    }
    return total;
  }

  isEncumbered() {
    return this.carryingWeight() > this.normalCarryingCapacity();
  }

  containerSpace() {
    let total = 0;
    for (const item of this.items) {
      if (CONFIG.VG.itemEquipmentTypes.includes(item.type) && 
          item.data.type !== 'container' &&
          !item.data.system.equipped &&
          item.data.system.volume) {  
          const roundedSpace = Math.ceil(item.data.system.volume * item.data.system.quantity);
          total += roundedSpace;
      }
    }
    return total;
  }

  containerCapacity() {
    let total = 0;
    for (const item of this.items) {
      if (item.type === 'container' && item.data.system.capacity) {
        total += item.data.system.capacity;
      }
    }
    return total;
  }

  async _testAbility(ability, abilityKey, abilityAbbrevKey, drModifiers) {
    let abilityRoll = new Roll(`1d20+@abilities.${ability}.value`, this.getRollData());
    abilityRoll.evaluate({async: false});
    await showDice(abilityRoll);
    const rollResult = {
      abilityKey,
      abilityRoll,
      displayFormula: `1d20 + ${game.i18n.localize(abilityAbbrevKey)}`,
      drModifiers,
    }
    const html = await renderTemplate(TEST_ABILITY_ROLL_CARD_TEMPLATE, rollResult)
    ChatMessage.create({
      content : html,
      sound : diceSound(),
      speaker : ChatMessage.getSpeaker({actor: this}),
    });
  }

  async testStrength() {
    let drModifiers = [];
    if (this.isEncumbered()) {
      drModifiers.push(`${game.i18n.localize('VG.Encumbered')}: ${game.i18n.localize('VG.DR')} +2`);
    }
    await this._testAbility("strength", "VG.AbilityStrength", "VG.AbilityStrengthAbbrev", drModifiers);
  }

  async testAgility() {
    let drModifiers = [];
    const armor = this.equippedArmor();
    if (armor) {
      const armorTier = CONFIG.VG.armorTiers[armor.data.system.tier.max];
      if (armorTier.agilityModifier) {
        drModifiers.push(`${armor.name}: ${game.i18n.localize('VG.DR')} +${armorTier.agilityModifier}`);
      }
    }
    if (this.isEncumbered()) {
      drModifiers.push(`${game.i18n.localize('VG.Encumbered')}: ${game.i18n.localize('VG.DR')} +2`);
    }
    await this._testAbility("agility", "VG.AbilityAgility", "VG.AbilityAgilityAbbrev", drModifiers);
  }

  async testPresence() {
    await this._testAbility("presence", "VG.AbilityPresence", "VG.AbilityPresenceAbbrev", null);
  }

  async testToughness() {
    await this._testAbility("toughness", "VG.AbilityToughness", "VG.AbilityToughnessAbbrev", null);
  }

  /**
   * Attack!
   */
  async attack(itemId) {
    let attackDR = await this.getFlag(CONFIG.VG.flagScope, CONFIG.VG.flags.ATTACK_DR);
    if (!attackDR) {
      attackDR = 12;  // default
    }
    const targetArmor = await this.getFlag(CONFIG.VG.flagScope, CONFIG.VG.flags.TARGET_ARMOR);    
    let dialogData = {
      attackDR,
      config: CONFIG.VG,
      itemId,
      targetArmor
    };
    const html = await renderTemplate(ATTACK_DIALOG_TEMPLATE, dialogData);
    return new Promise(resolve => {
      new Dialog({
         title: game.i18n.localize('VG.Attack'),
         content: html,
         buttons: {
            roll: {
              icon: '<i class="fas fa-dice-d20"></i>',
              label: game.i18n.localize('VG.Roll'),
              // callback: html => resolve(_createItem(this.actor, html[0].querySelector("form")))
              callback: html => this._attackDialogCallback(html)
            },
         },
         default: "roll",
         close: () => resolve(null)
        }).render(true);
    });
  }

  /**
   * Callback from attack dialog.
   */
  async _attackDialogCallback(html) {
    const form = html[0].querySelector("form");
    const itemId = form.itemid.value;
    const attackDR = parseInt(form.attackdr.value);
    const targetArmor = form.targetarmor.value;
    if (!itemId || !attackDR) {
      // TODO: prevent form submit via required fields
      return;
    }
    await this.setFlag(CONFIG.VG.flagScope, CONFIG.VG.flags.ATTACK_DR, attackDR);
    await this.setFlag(CONFIG.VG.flagScope, CONFIG.VG.flags.TARGET_ARMOR, targetArmor);
    this._rollAttack(itemId, attackDR, targetArmor);
  }

  /**
   * Do the actual attack rolls and resolution.
   */
  async _rollAttack(itemId, attackDR, targetArmor) {
    const item = this.items.get(itemId);
    const itemRollData = item.getRollData();
    const actorRollData = this.getRollData();

    // roll 1: attack
    const isRanged = itemRollData.weaponType === 'ranged';
    // ranged weapons use presence; melee weapons use strength
    const ability = isRanged ? 'presence' : 'strength';
    let attackRoll = new Roll(`d20+@abilities.${ability}.value`, actorRollData);
    attackRoll.evaluate({async: false});
    await showDice(attackRoll);

    const d20Result = attackRoll.terms[0].results[0].result;
    const isFumble = (d20Result === 1);
    const isCrit = (d20Result === 20);
    // nat 1 is always a miss, nat 20 is always a hit, otherwise check vs DR
    const isHit =
      attackRoll.total !== 1 &&
      (attackRoll.total === 20 || attackRoll.total >= attackDR);

    let attackOutcome = null;
    let damageRoll = null;
    let targetArmorRoll = null;
    let takeDamage = null;
    if (isHit) {
      // HIT!!!
      attackOutcome = game.i18n.localize(isCrit ? 'VG.AttackCritText' : 'VG.Hit');
      // roll 2: damage
      const damageFormula = isCrit ? "@damageDie * 2" : "@damageDie";
      damageRoll = new Roll(damageFormula, itemRollData);
      damageRoll.evaluate({async: false});
      let dicePromises = [];
      addShowDicePromise(dicePromises, damageRoll);
      let damage = damageRoll.total;
      // roll 3: target damage reduction
      if (targetArmor) {
        targetArmorRoll = new Roll(targetArmor, {});
        targetArmorRoll.evaluate({async: false});
        addShowDicePromise(dicePromises, targetArmorRoll);
        damage = Math.max(damage - targetArmorRoll.total, 0);
      }
      if (dicePromises) {
        await Promise.all(dicePromises);
      }
      takeDamage = `${game.i18n.localize('VG.Inflict')} ${damage} ${game.i18n.localize('VG.Damage')}`
    } else {
      // MISS!!!
      attackOutcome = game.i18n.localize(isFumble ? 'VG.AttackFumbleText' : 'VG.Miss');
    }

    // TODO: decide keys in handlebars/template?
    const abilityAbbrevKey = isRanged ? "VG.AbilityPresenceAbbrev" : "VG.AbilityStrengthAbbrev";    
    const weaponTypeKey = isRanged ? 'VG.WeaponTypeRanged' : 'VG.WeaponTypeMelee';
    const rollResult = {
      actor: this,
      attackDR,
      attackFormula: `1d20 + ${game.i18n.localize(abilityAbbrevKey)}`,      
      attackRoll,
      attackOutcome,
      damageRoll,      
      items: [item],
      takeDamage,
      targetArmorRoll,
      weaponTypeKey
    };
    await this._renderAttackRollCard(rollResult);
    await this._decrementWeaponAmmo(item);    
  }

  async _decrementWeaponAmmo(weapon) {
    if (weapon.data.system.ammoId) {
      const ammo = this.items.get(weapon.data.system.ammoId);
      if (ammo) {
        const attr = "data.quantity";
        const currQuantity = getProperty(ammo.data, attr);
        if (currQuantity > 1) {
          // decrement quantity by 1
          await ammo.update({ [attr]: currQuantity - 1 });
        } else {
          // quantity is now zero, so delete ammo item
          await this.deleteEmbeddedDocuments("Item", [ammo.id]);
        }
      }
    }
  }
  
  /**
   * Show attack rolls/result in a chat roll card.
   */
  async _renderAttackRollCard(rollResult) {
    const html = await renderTemplate(ATTACK_ROLL_CARD_TEMPLATE, rollResult)
    ChatMessage.create({
      content : html,
      sound : diceSound(),
      speaker : ChatMessage.getSpeaker({actor: this}),
    });
  }

  /**
   * Defend!
   */
  async defend() {
    // look up any previous DR or incoming attack value
    let defendDR = await this.getFlag(CONFIG.VG.flagScope, CONFIG.VG.flags.DEFEND_DR);
    if (!defendDR) {
      defendDR = 12;  // default
    }
    let incomingAttack = await this.getFlag(CONFIG.VG.flagScope, CONFIG.VG.flags.INCOMING_ATTACK);
    if (!incomingAttack) {
      incomingAttack = "1d4";  // default
    }

    const armor = this.equippedArmor();
    let drModifiers = [];
    if (armor) {
      // armor defense adjustment is based on its max tier, not current
      // TODO: maxTier is getting stored as a string
      const maxTier = parseInt(armor.data.system.tier.max);
      const defenseModifier = CONFIG.VG.armorTiers[maxTier].defenseModifier;
      if (defenseModifier) { 
        drModifiers.push(`${armor.name}: ${game.i18n.localize('VG.DR')} +${defenseModifier}`);       
      }
    }
    if (this.isEncumbered()) {
      drModifiers.push(`${game.i18n.localize('VG.Encumbered')}: ${game.i18n.localize('VG.DR')} +2`);
    }

    let dialogData = {
      defendDR,
      drModifiers,
      incomingAttack,
    };
    const html = await renderTemplate(DEFEND_DIALOG_TEMPLATE, dialogData);

    return new Promise(resolve => {
      new Dialog({
         title: game.i18n.localize('VG.Defend'),
         content: html,
         buttons: {
            roll: {
              icon: '<i class="fas fa-dice-d20"></i>',
              label: game.i18n.localize('VG.Roll'),
              callback: html => this._defendDialogCallback(html)
            },
         },
         default: "roll",
         render: (html) => {
          html.find("input[name='defensebasedr']").on("change", this._onDefenseBaseDRChange.bind(this));
          html.find("input[name='defensebasedr']").trigger("change");
        },
         close: () => resolve(null)
        }).render(true);
    });
  }

  _onDefenseBaseDRChange(event) {
    event.preventDefault();
    const baseInput = $(event.currentTarget);
    let drModifier = 0;
    const armor = this.equippedArmor();
    if (armor) {
      // TODO: maxTier is getting stored as a string
      const maxTier = parseInt(armor.data.system.tier.max);
      const defenseModifier = CONFIG.VG.armorTiers[maxTier].defenseModifier;
      if (defenseModifier) { 
        drModifier += defenseModifier;
      }
    }
    if (this.isEncumbered()) {
      drModifier += 2;
    }
    const modifiedDr = parseInt(baseInput[0].value) + drModifier;
    // TODO: this is a fragile way to find the other input field
    const modifiedInput = baseInput.parent().parent().find("input[name='defensemodifieddr']");
    modifiedInput.val(modifiedDr.toString());
  }

  /**
   * Callback from defend dialog.
   */
  async _defendDialogCallback(html) {
    const form = html[0].querySelector("form");
    const baseDR = parseInt(form.defensebasedr.value);
    const modifiedDR = parseInt(form.defensemodifieddr.value);
    const incomingAttack = form.incomingattack.value;
    if (!baseDR || !modifiedDR || !incomingAttack) {
      // TODO: prevent dialog/form submission w/ required field(s)
      return;
    }
    await this.setFlag(CONFIG.VG.flagScope, CONFIG.VG.flags.DEFEND_DR, baseDR);
    await this.setFlag(CONFIG.VG.flagScope, CONFIG.VG.flags.INCOMING_ATTACK, incomingAttack);
    this._rollDefend(modifiedDR, incomingAttack);
  }

  /**
   * Do the actual defend rolls and resolution.
   */
  async _rollDefend(defendDR, incomingAttack) {
    const rollData = this.getRollData();
    const armor = this.equippedArmor();
    const helmet = this.equippedHelmet();

    // roll 1: defend
    let defendRoll = new Roll("d20+@abilities.agility.value", rollData);
    defendRoll.evaluate({async: false});
    await showDice(defendRoll);

    const d20Result = defendRoll.terms[0].results[0].result;
    const isFumble = (d20Result === 1);
    const isCrit = (d20Result === 20);

    let items = [];
    let damageRoll = null;
    let armorRoll = null;
    let defendOutcome = null;
    let takeDamage = null;

    if (isCrit) {
      // critical success
      defendOutcome = game.i18n.localize('VG.DefendCritText');
    } else if (defendRoll.total >= defendDR) {
      // success
      defendOutcome = game.i18n.localize('VG.Dodge');
    } else {
      // failure
      if (isFumble) {
        defendOutcome = game.i18n.localize('VG.DefendFumbleText');
      } else {
        defendOutcome = game.i18n.localize('VG.YouAreHit');
      }

      // roll 2: incoming damage
      let damageFormula = incomingAttack;
      if (isFumble) {
        damageFormula += " * 2";
      }
      damageRoll = new Roll(damageFormula, {});
      damageRoll.evaluate({async: false});
      let dicePromises = [];
      addShowDicePromise(dicePromises, damageRoll);
      let damage = damageRoll.total;

      // roll 3: damage reduction from equipped armor and helmet
      let damageReductionDie = "";
      if (armor) {
        damageReductionDie = CONFIG.VG.armorTiers[armor.data.system.tier.value].damageReductionDie;
        items.push(armor);
      }    
      if (helmet) {
        damageReductionDie += "+1";
        items.push(helmet);
      }
      if (damageReductionDie) {
        armorRoll = new Roll("@die", {die: damageReductionDie});
        armorRoll.evaluate({async: false});
        addShowDicePromise(dicePromises, armorRoll);
        damage = Math.max(damage - armorRoll.total, 0);
      }
      if (dicePromises) {
        await Promise.all(dicePromises);
      }
      takeDamage = `${game.i18n.localize('VG.Take')} ${damage} ${game.i18n.localize('VG.Damage')}`
    }

    const rollResult = {
      actor: this,
      armorRoll,
      damageRoll,
      defendDR,
      defendFormula: `1d20 + ${game.i18n.localize("VG.AbilityAgilityAbbrev")}`,
      defendOutcome,
      defendRoll,
      items,
      takeDamage
    };
    await this._renderDefendRollCard(rollResult);
  }

  /**
   * Show attack rolls/result in a chat roll card.
   */
  async _renderDefendRollCard(rollResult) {
    const html = await renderTemplate(DEFEND_ROLL_CARD_TEMPLATE, rollResult)
    ChatMessage.create({
      content : html,
      sound : diceSound(),
      speaker : ChatMessage.getSpeaker({actor: this}),
    });
  }

  /**
   * Check morale!
   */
  async checkMorale(sheetData) {
    const actorRollData = this.getRollData();
    const moraleRoll = new Roll("2d6", actorRollData);
    moraleRoll.evaluate({async: false});
    await showDice(moraleRoll);

    let outcomeRoll = null;
    if (moraleRoll.total > this.data.system.morale) {
      outcomeRoll = new Roll("1d6", actorRollData);
      outcomeRoll.evaluate({async: false});
      await showDice(outcomeRoll);
    }
    await this._renderMoraleRollCard(moraleRoll, outcomeRoll);
  }

  /**
   * Show morale roll/result in a chat roll card.
   */
  async _renderMoraleRollCard(moraleRoll, outcomeRoll) {
    let outcomeKey = null;
    if (outcomeRoll) {
      outcomeKey = outcomeRoll.total <= 3 ? "VG.MoraleFlees" : "VG.MoraleSurrenders";
    } else {
      outcomeKey = "VG.StandsFirm";
    }
    const outcomeText = game.i18n.localize(outcomeKey);
    const rollResult = {
      actor: this,
      outcomeRoll,
      outcomeText,
      moraleRoll,      
    };
    const html = await renderTemplate(MORALE_ROLL_CARD_TEMPLATE, rollResult)
    ChatMessage.create({
      content : html,
      sound : diceSound(),
      speaker : ChatMessage.getSpeaker({actor: this}),
    });
  }

  /**
   * Check reaction!
   */
  async checkReaction(sheetData) {
    const actorRollData = this.getRollData();
    const reactionRoll = new Roll("2d6", actorRollData);
    reactionRoll.evaluate({async: false});
    await showDice(reactionRoll);
    await this._renderReactionRollCard(reactionRoll);
  }

  /**
   * Show reaction roll/result in a chat roll card.
   */
  async _renderReactionRollCard(reactionRoll) {
    let key = "";
    if (reactionRoll.total <= 3) {
      key = "VG.ReactionKill";
    } else if (reactionRoll.total <= 6) {
      key = "VG.ReactionAngered";
    } else if (reactionRoll.total <= 8) {
      key = "VG.ReactionIndifferent";
    } else if (reactionRoll.total <= 10) {
      key = "VG.ReactionAlmostFriendly";
    } else {
      key = "VG.ReactionHelpful";
    }
    let reactionText = game.i18n.localize(key);
    const rollResult = {
      actor: this,
      reactionRoll,
      reactionText,
    };
    const html = await renderTemplate(REACTION_ROLL_CARD_TEMPLATE, rollResult)
    ChatMessage.create({
      content : html,
      sound : diceSound(),
      speaker : ChatMessage.getSpeaker({actor: this}),
    });
  }

  async activateTribute() {
    if (this.data.system.neuromancyPoints.value < 1) {
      ui.notifications.warn(`${game.i18n.localize('VG.NoNeuromancyPointsRemaining')}!`);
      return;
    }

    const activateRoll = new Roll("d20+@abilities.presence.value", this.getRollData());
    activateRoll.evaluate({async: false});
    await showDice(activateRoll);

    const d20Result = activateRoll.terms[0].results[0].result;
    const isFumble = (d20Result === 1);
    const isCrit = (d20Result === 20);
    const activateDR = 12;

    let activateOutcome = null;
    let damageRoll = null;
    let takeDamage = null;
    if (activateRoll.total >= activateDR) {
      // SUCCESS!!!
      activateOutcome = game.i18n.localize(isCrit ? 'VG.CriticalSuccess' : 'VG.Success');
    } else {
      // FAILURE
      activateOutcome = game.i18n.localize(isFumble ? 'VG.ActivateTributeFumble' : 'VG.Failure');
      damageRoll = new Roll("1d2", this.getRollData());
      damageRoll.evaluate({async: false});
      await showDice(damageRoll);
      takeDamage = `${game.i18n.localize('VG.Take')} ${damageRoll.total} ${game.i18n.localize('VG.Damage')}, ${game.i18n.localize('VG.ActivateTributeDizzy')}`;
    }

    const rollResult = {
      activateDR,
      activateFormula: `1d20 + ${game.i18n.localize("VG.AbilityPresenceAbbrev")}`,
      activateOutcome,
      activateRoll,
      damageRoll,
      takeDamage,
    };
    const html = await renderTemplate(ACTIVATE_TRIBUTE_ROLL_CARD_TEMPLATE, rollResult)
    ChatMessage.create({
      content : html,
      sound : diceSound(),
      speaker : ChatMessage.getSpeaker({actor: this}),
    });

    const newPowerUses = Math.max(0, this.data.system.neuromancyPoints.value - 1);
    return this.update({["data.neuromancyPoints.value"]: newPowerUses});
  }

  async useSkill(itemId) {
    const item = this.items.get(itemId);
    if (!item || !item.data.system.rollLabel) {
      return;
    }

    if (item.data.system.rollMacro) {
      // roll macro
      if (item.data.system.rollMacro.includes(",")) {
        // assume it's a CSV string for {pack},{macro name}
        const [packName, macroName] = item.data.system.rollMacro.split(",");
        const pack = game.packs.get(packName);
        if (pack) {
            const content = await pack.getDocuments();
            const macro = content.find(i => i.name === macroName);
            if (macro) {
              macro.execute();
            } else {
              console.log(`Could not find macro ${macroName} in pack ${packName}.`);
            }
        } else {
          console.log(`Pack ${packName} not found.`);
        }
      } else {
        // assume it's the name of a macro in the current world/game
        const macro = game.macros.find(m => m.name === item.data.system.rollMacro);
        if (macro) {
          macro.execute();
        } else {
          console.log(`Could not find macro ${item.data.system.rollMacro}.`);
        }
      }
    } else if (item.data.system.rollFormula) {
      // roll formula
      await this._rollOutcome(
        item.data.system.rollFormula,
        this.getRollData(),
        item.data.system.rollLabel,
        (roll) => ``);
    }    
  }

  async _rollOutcome(dieRoll, rollData, cardTitle, outcomeTextFn, rollFormula=null) {
    let roll = new Roll(dieRoll, rollData);
    roll.evaluate({async: false});
    await showDice(roll);
    const rollResult = {
      cardTitle: cardTitle,
      outcomeText: outcomeTextFn(roll),
      roll,
      rollFormula: rollFormula ?? roll.formula,
    };
    const html = await renderTemplate(OUTCOME_ROLL_CARD_TEMPLATE, rollResult)
    ChatMessage.create({
      content : html,
      sound : diceSound(),
      speaker : ChatMessage.getSpeaker({actor: this}),
    });    
    return roll;
  }

  async rollOmens() {
    const classItem = this.items.filter(x => x.type === "class").pop();
    if (!classItem) {
      return;
    }
    const roll = await this._rollOutcome(
      "@favorDie",
      classItem.getRollData(),
      `${game.i18n.localize('VG.Favors')}`, 
      (roll) => ` ${game.i18n.localize('VG.Favors')}: ${Math.max(0, roll.total)}`);
    const newOmens = Math.max(0, roll.total);
    return this.update({["data.favors"]: {max: newOmens, value: newOmens}});
  }

  async rollNeuromancyPointsPerDay() {
    const roll = await this._rollOutcome(
      "d4+@abilities.presence.value",
      this.getRollData(),
      `${game.i18n.localize('VG.NeuromancyPoints')} ${game.i18n.localize('VG.PerDay')}`, 
      (roll) => ` ${game.i18n.localize('VG.NeuromancyPoints')}: ${Math.max(0, roll.total)}`,
      `1d4 + ${game.i18n.localize("VG.AbilityPresenceAbbrev")}`);
    const newPoints = Math.max(0, roll.total);
    return this.update({["data.neuromancyPoints"]: {max: newPoints, value: newPoints}});
  }

  /**
   * 
   * @param {*} restLength "short" or "long"
   * @param {*} foodAndDrink "eat", "donteat", or "starve"
   * @param {*} infected true/false
   */
  async rest(restLength, foodAndDrink, infected) {
    if (restLength === "short") {
      if (foodAndDrink === "eat") {
        await this.rollHealHitPoints("d4");
      } else {
        await this.showRestNoEffect();
      }
    } else if (restLength === "long") {
      let canRestore = true;
      if (foodAndDrink === "eat") {
        await this.rollHealHitPoints("d6");
        await this.rollNeuromancyPointsPerDay();
        if (this.data.system.favors.value === 0) {
          await this.rollOmens();
        }
      } else if (infected) {
        // wurm restores 1 hp each day
        await this.wurmSharesStrength();
      } else if (foodAndDrink === "donteat") {
        await this.showRestNoEffect();
      } else if (foodAndDrink === "starve") {
        await this.rollStarvation();
      }
    }
  }

  async showRestNoEffect() {
    const result = {
      cardTitle: game.i18n.localize("VG.Rest"),
      outcomeText: game.i18n.localize("VG.NoEffect"),
    };
    const html = await renderTemplate(OUTCOME_ONLY_ROLL_CARD_TEMPLATE, result);
    await ChatMessage.create({
      content : html,
      sound : diceSound(),
      speaker : ChatMessage.getSpeaker({actor: this}),
    });
  }

  async rollHealHitPoints(dieRoll) {
    const roll = await this._rollOutcome(
      dieRoll,
      this.getRollData(),
      game.i18n.localize("VG.Rest"), 
      (roll) => `${game.i18n.localize("VG.Heal")} ${roll.total} ${game.i18n.localize("VG.HP")}`);
    const newHP = Math.min(this.data.system.hp.max, this.data.system.hp.value + roll.total);
    return this.update({["data.hp.value"]: newHP});
  }

  async rollStarvation() {
    const roll = await this._rollOutcome(
      "d4",
      this.getRollData(),
      game.i18n.localize("VG.Starvation"), 
      (roll) => `${game.i18n.localize("VG.Take")} ${roll.total} ${game.i18n.localize("VG.Damage")}`);
    const newHP = this.data.system.hp.value - roll.total;
    return this.update({["data.hp.value"]: newHP});
  }

  async wurmSharesStrength() {
    const result = {
      cardTitle: game.i18n.localize("VG.Rest"),
      outcomeText: game.i18n.localize("VG.WurmSharesStrength"),
    };
    const html = await renderTemplate(OUTCOME_ONLY_ROLL_CARD_TEMPLATE, result);
    await ChatMessage.create({
      content : html,
      sound : diceSound(),
      speaker : ChatMessage.getSpeaker({actor: this}),
    });
    const newHP = Math.min(this.data.system.hp.max, this.data.system.hp.value + 1);
    return this.update({["data.hp.value"]: newHP});
  }

  async improve() {
    const oldHp = this.data.system.hp.max;
    const newHp = this._betterHp(oldHp);
    const oldStr = this.data.system.abilities.strength.value;
    const newStr = this._betterAbility(oldStr);
    const oldAgi = this.data.system.abilities.agility.value;
    const newAgi = this._betterAbility(oldAgi);
    const oldPre = this.data.system.abilities.presence.value
    const newPre = this._betterAbility(oldPre);
    const oldTou = this.data.system.abilities.toughness.value;
    const newTou = this._betterAbility(oldTou);

    let hpOutcome = this._abilityOutcome(game.i18n.localize('VG.HP'), oldHp, newHp);
    let strOutcome = this._abilityOutcome(game.i18n.localize('VG.AbilityStrength'), oldStr, newStr);
    let agiOutcome = this._abilityOutcome(game.i18n.localize('VG.AbilityAgility'), oldAgi, newAgi);
    let preOutcome = this._abilityOutcome(game.i18n.localize('VG.AbilityPresence'), oldPre, newPre);
    let touOutcome = this._abilityOutcome(game.i18n.localize('VG.AbilityToughness'), oldTou, newTou);

    // show a single chat message for everything
    const data = {
      agiOutcome,
      hpOutcome,
      preOutcome,
      strOutcome,
      touOutcome,
    };
    const html = await renderTemplate(IMPROVE_ROLL_CARD_TEMPLATE, data);
    ChatMessage.create({
      content : html,
      sound : CONFIG.sounds.dice,  // make a single dice sound
      speaker : ChatMessage.getSpeaker({actor: this}),
    });

    // set new stats on the actor
    return this.update({
      ["data.abilities.strength.value"]: newStr,
      ["data.abilities.agility.value"]: newAgi,
      ["data.abilities.presence.value"]: newPre,
      ["data.abilities.toughness.value"]: newTou,
      ["data.hp.max"]: newHp,
    });
  }

  _betterHp(oldHp) {
    const hpRoll = new Roll("6d10", this.getRollData()).evaluate({async: false});
    if (hpRoll.total >= oldHp) {
      // success, increase HP
      const howMuchRoll = new Roll("1d6", this.getRollData()).evaluate({async: false});
      return oldHp + howMuchRoll.total;
    } else {
      // no soup for you
      return oldHp;
    }
  }

  _betterAbility(oldVal) {
    const roll = new Roll("1d6", this.getRollData()).evaluate({async: false});
    if (roll.total === 1 || roll.total < oldVal) {
      // decrease, to a minimum of -3
      return Math.max(-3, oldVal - 1);
    } else {
      // increase, to a max of +6
      return Math.min(6, oldVal + 1);
    }
  }

  _abilityOutcome(abilityName, oldVal, newVal) {
    if (newVal < oldVal) {
      return `Lose ${oldVal - newVal} ${abilityName}`;
    } else if (newVal > oldVal) {
      return `Gain ${newVal - oldVal} ${abilityName}`;
    } else {
      return `${abilityName} unchanged`;
    }
  }

  async scvmify() {
    new ScvmDialog(this).render(true);
  }

  async rollBroken() {
    const brokenRoll = new Roll("1d4").evaluate({async: false});
    await showDice(brokenRoll);

    let outcomeLines = [];
    let additionalRolls = [];
    if (brokenRoll.total === 1) {
      // fall unconscious
      const unconsciousRoll = new Roll("1d4").evaluate({async: false});
      const s = unconsciousRoll.total > 1 ? "s" : "";
      const hpRoll = new Roll("1d4").evaluate({async: false});
      outcomeLines = [`Fall unconscious`, `for ${unconsciousRoll.total} round${s},`, `awaken with ${hpRoll.total} HP.`];
      additionalRolls = [unconsciousRoll, hpRoll];
    } else if (brokenRoll.total === 2) {
      // severed limb or lost eye
      const limbRoll = new Roll("1d6").evaluate({async: false});
      const actRoll = new Roll("1d4").evaluate({async: false});
      const hpRoll = new Roll("1d4").evaluate({async: false});
      const s = actRoll.total > 1 ? "s" : "";
      if (limbRoll.total <= 5) {
        // severed limb
        outcomeLines = [
          "Severed limb,",
          "reduce Agility",
          "permanently by 1.",
          `Can't act for ${actRoll.total} round${s} then become active`, `with ${hpRoll.total} HP.`
        ];
      } else {
        // lost eye
        outcomeLines = [
          "Lost eye,",
          "reduce Presence",
          "permanently by 1",
          `Can't act for ${actRoll.total} round${s} then become active with ${hpRoll.total} HP.`
        ];
      }
      additionalRolls = [limbRoll, actRoll, hpRoll];
    } else if (brokenRoll.total === 3) {
      // hemorrhage
      const hemorrhageRoll = new Roll("1d2").evaluate({async: false}); 
      const s = hemorrhageRoll.total > 1 ? "s" : "";
      outcomeLines = [
        `Hemorrhage:`, 
        `dead in ${hemorrhageRoll.total} hour${s}`, `unless treated.`,
        `All tests are DR16`, 
        `the first hour.`
      ];
      if (hemorrhageRoll.total == 2) {
        outcomeLines.push( `DR18 the last hour.`);
      }
      additionalRolls = [hemorrhageRoll];
    } else {
      // loss of eye or death
      const deathRoll = new Roll("1d4").evaluate({async: false}); 
      if (deathRoll.total <= 2) {
        // loss of eye
        outcomeLines = [
          "Loss of eye,",
          "reduce Presence",
          "permanently by 1.",
        ];
      } else {
        // death
        outcomeLines = ["You are very dead."];
      }
    }

    const data = {
      additionalRolls,
      brokenRoll,
      outcomeLines
    };
    const html = await renderTemplate(BROKEN_ROLL_CARD_TEMPLATE, data);
    ChatMessage.create({
      content : html,
      sound : diceSound(),
      speaker : ChatMessage.getSpeaker({actor: this}),
    });
  }
}  
