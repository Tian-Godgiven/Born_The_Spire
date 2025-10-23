import { createApp } from "vue";
import App from "./App.vue";
import router from "@/ui/router";


createApp(App)
    .use(router)
    .mount("#app");
