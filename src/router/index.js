import { createRouter, createWebHistory } from "vue-router"
import Home from "@/views/Home.vue"

const routes = [
    {
        path: "/",
        name: "home",
        component: Home,
    },
    {
        path: '/tpa-template/:templateId?',
        name: 'tpa-template',
        component: () => import('@/views/TPA-Template.vue'),
    },
    {
        path: "/tpa/:classId?/:projectId?",
        name: "tpa",
        component: () => import("@/views/TPA.vue"),
    },
    {
        path: "/catalogue",
        name: "catalogue",
        component: () => import("@/views/Catalogue.vue"),
    },
    {
        path: "/:catchAll(.*)",
        name: "notFound",
        component: () => import("@/views/NotFound.vue"),
    },
    {
        path: '/templates-management',
        name: 'templates-management',
        component: () => import('@/views/TemplatesManagement.vue'),
    },
    {
        path: "/new-course",
        name: "new-course",
        component: () => import("@/views/NewCourse.vue"),
    },
    {
        path: "/tpa-list/:classId?",
        name: "tpa-list",
        component: () => import("@/views/TPA-list.vue"),
    }
]

const router = createRouter({
    history: createWebHistory(), 
    routes,
})

export default router;