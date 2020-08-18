export const cymaticFrequency = () => {
  const frequencies = ["250", "370", "564", "1140"];
  return frequencies[Math.floor(Math.random() * frequencies.length)];
};
