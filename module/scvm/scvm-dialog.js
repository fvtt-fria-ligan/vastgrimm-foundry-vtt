import { createScvm, findClasses, scvmifyActor } from "./scvmfactory.js";
import { byName, sample } from "../utils.js";

export async function showScvmDialog(actor) {
  const dialog = new ScvmDialog();
  dialog.actor = actor;
  const classes = await findClasses();
  classes.sort(byName);
  dialog.classes = classes.map(x => {
    return { name: x.name, uuid: x.uuid};
  });
  dialog.render(true);
};

export default class ScvmDialog extends Application {

    /** @override */
    static get defaultOptions() {
        const options = super.defaultOptions;
        options.id = "scvm-dialog";
        options.classes = ["vastgrimm"];
        options.title = "The Progenitor";
        options.template = "systems/vastgrimm/templates/dialog/scvm-dialog.html";
        options.width = 420;
        options.height = "auto";
        return options;
    }

    /** @override */
    getData(options={}) {
        return foundry.utils.mergeObject(super.getData(options), {
            classes: this.classes,
            forActor: (this.actor !== undefined && this.actor !== null),
        });
    }

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);
        html.find('.toggle-all').click(this._onToggleAll.bind(this));
        html.find('.toggle-none').click(this._onToggleNone.bind(this));
        html.find('.cancel-button').click(this._onCancel.bind(this));
        html.find('.scvm-button').click(this._onScvm.bind(this));
    }

    _onToggleAll(event) {
        event.preventDefault();
        const form = $(event.currentTarget).parents(".scvm-dialog")[0];
        $(form).find(".class-checkbox").prop('checked', true);
    }

    _onToggleNone(event) {
        event.preventDefault();
        const form = $(event.currentTarget).parents(".scvm-dialog")[0];
        $(form).find(".class-checkbox").prop('checked', false);
    }

    _onCancel(event) {
        event.preventDefault();
        this.close();
    }

    async _onScvm(event) {
        event.preventDefault();
        const form = $(event.currentTarget).parents(".scvm-dialog")[0];
        const uuids = [];
        $(form).find("input:checked").each(function() {
           uuids.push($(this).attr("name"));
        });
        if (uuids.length === 0) {
            // nothing selected, so bail
            return;
        }
        const uuid = sample(uuids);
        const clazz = await fromUuid(uuid);
        if (!clazz) {
            // couldn't find class item, so bail
            const err = `No class item found in compendium ${packName}`;
            console.error(err);
            ui.notifications.error(err);
            return;
        }

        try {
            if (this.actor) {
                await scvmifyActor(this.actor, clazz);
            } else {
                await createScvm(clazz);
            }    
        } catch (err) {
            console.error(err);
            ui.notifications.error(`Error creating ${clazz.name}. Check console for error log.`);
        }

        this.close();
    }    
}  
