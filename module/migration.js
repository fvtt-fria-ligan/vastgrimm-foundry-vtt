export const migrateWorld = async () => {
    ui.notifications.info(`Applying Vast Grimm System Migration for version ${game.system.data.version}. Please be patient and do not close your game or shut down your server.`, {permanent: true});
    await migrateActors();
    await migrateItems();
    // TODO: fix scene and compendium migration.
    // Our scene/token/actorData don't seem to align with dnd5e's, and that causes bad things to happen.
    //await migrateScenes();
    //await migrateCompendiums();
    game.settings.set("vastgrimm", "systemMigrationVersion", game.system.data.version);
    ui.notifications.info(`Vast Grimm System Migration to version ${game.system.data.version} completed!`, {permanent: true});  
};

const migrateActors = async () => {
  // for (let a of game.actors.entities) {
  //   try {
  //     const updateData = migrateActorData(a.data);
  //     if (!isObjectEmpty(updateData)) {
  //       console.log(`Migrating Actor entity ${a.name}`);
  //       await a.update(updateData, {enforceTypes: false});
  //     }
  //   } catch(err) {
  //     err.message = `Failed migration for Actor ${a.name}: ${err.message}`;
  //     console.error(err);
  //   }
  // }
};

const migrateActorData = (data) => {
    const updateData = {};
    return updateData;
};

const cleanActorData = (data) => {
  // Remove any fields from the data that don't appear in the model
  const model = game.system.model.Actor[data.type];
  data.data = filterObject(data.data, model);
  // TODO: Scrub system flags?
  return data;
};

const migrateItems = async () => {
    // for (let item of game.items.entities) {
    //     try {
    //       const updateData = migrateItemData(item.data);
    //       if (!isObjectEmpty(updateData)) {
    //         console.log(`Migrating Item entity ${item.name}`);
    //         await item.update(updateData, {enforceTypes: false});
    //       }
    //       // TODO: don't do any cleaning for now
    //       // const cleanData = cleanItemData(item.data);
    //       // if (!isObjectEmpty(cleanData)) {
    //       //   console.log(`Cleaning Item entity ${item.name}`);
    //       //   await item.update(cleanData, {enforceTypes: false});
    //       // }
    //     } catch(err) {
    //       err.message = `Failed migration for Item ${item.name}: ${err.message}`;
    //       console.error(err);
    //     }
    // }
};

const migrateItemData = (data) => {
    const updateData = {};
    return updateData;
};

const cleanItemData = (data) => {
  // Remove any fields from the data that don't appear in the model
  const model = game.system.model.Item[data.type];
  data.data = filterObject(data.data, model);
  // TODO: Scrub system flags?
  return data;  
};
