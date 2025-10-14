export const getIconPath = (icon) => {
    return new URL(`/src/assets/imgs/${icon}.png`, import.meta.url).href;
};
export const getIconPathMarkIcons = (icon) => {
    return new URL(`/src/assets/imgs/markIcons/${icon}.png`, import.meta.url).href;
};