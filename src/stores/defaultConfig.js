import { set } from 'ol/transform';
import { defineStore } from 'pinia'

export const useDefaultConfigStore = defineStore('defaultConfig', {
    state: () => ({
        defaultConfig: {
            initialVisible: true,
        },
        //缓存一些状态
        coastlineStatus: null
    }),
    getters: {
        getInitialVisible() {
            return this.defaultConfig.initialVisible;
        },
        getCoastlineStatus() {
            return this.coastlineStatus;
        }
    },
    actions: {
        setInitialVisible(visible) {
            this.defaultConfig.initialVisible = visible;
        },
        setCoastlinePopupVisible(data) {
            this.coastlineStatus = data
        },
    },
})