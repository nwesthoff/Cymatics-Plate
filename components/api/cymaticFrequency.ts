export const cymaticFrequency = () => {
  const frequencies = [
    "85",
    "250",
    "370",
    "564",
    "647",
    "979",
    "1140",
    "1152",
    "1272",
    "2251",
    "2533",
  ];
  return frequencies[Math.floor(Math.random() * frequencies.length)];
};
