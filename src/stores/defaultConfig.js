import { defineStore } from 'pinia'

export const useDefaultConfigStore = defineStore('defaultConfig', {
    state: () => ({
        defaultConfig: {
            initialVisible: true,
        },
    }),
    getters: {
        getInitialVisible() {
            return this.defaultConfig.initialVisible;
        },
    },
    actions: {
        setInitialVisible(visible) {
            this.defaultConfig.initialVisible = visible;
        },
    },
})