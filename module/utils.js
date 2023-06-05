export const byName = (a, b) =>
  a.name > b.name ? 1 : b.name > a.name ? -1 : 0;

export const sample = (array) => {
  if (!array) {
    return;
  }
  return array[Math.floor(Math.random() * array.length)];
};
